/*
 * Mod of the protect module for databus resource protection
 */

const COOKIES = require('express-openid-connect/lib/cookies');
const COOKIE_NAME = 'skipSilentLogin';
const jwt = require('jsonwebtoken');

var oidc = require('express-openid-connect');
var oidcConfig = require('./oidc.json');

const weakRef = require('express-openid-connect/lib/weakCache');
var getRandomValues = require('get-random-values');

var fs = require('fs');
const Constants = require('../constants');
const DatabusUserDatabase = require('../../../userdb');
const ServerUtils = require('../utils/server-utils');

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function forceLogin(request, response) {

  response.oidc.getRedirectUri = function () {
    return getRequestUri(request) + Constants.DATABUS_OIDC_CALLBACK_ROUTE;
  }

  if (request.query.redirectUrl == undefined) {
    response.oidc.login();
  } else {
    response.oidc.login({
      returnTo: decodeURIComponent(request.query.redirectUrl),
      authorizationParams: {
        prompt: "login"
      }
    });
  }
}

function getRequestUri(request) {

  let host = request.hostname;
  let port = '';

  try {
    if (request.headers.host != undefined) {
      let headerHost = request.headers.host.split(':');
      port = headerHost[1] || '';
    }
  } catch {
    port = '';
  }

  let protocol = host == 'localhost' ? 'http' : 'https';
  return protocol + '://' + host + (port === '' ? '' : ':' + port);
}

function cancelSilentLogin(req, res) {
  const {
    config: {
      session: {
        cookie: { secure, domain, path },
      },
    },
  } = weakRef(req.oidc);
  res.cookie(COOKIE_NAME, true, {
    httpOnly: true,
    secure,
    domain,
    path,
  });
};

function logAccess(user, url) {
  var stream = fs.createWriteStream("/var/log/databus-access.log", { flags: 'a' });
  stream.write(user + " " + url + "\n");
  stream.end();
}

class DatabusProtect {

  constructor(memoryStore) {

    this.userdb = new DatabusUserDatabase();
    this.userdb.connect();
    this.oidc = oidc;
    this.oidc.debug = (str) => console.log(str);
  }

  isBrowserRequest(req) {
    var agent = req.headers['user-agent'];
    return agent != null && (agent.includes('Mozilla') || agent.includes('Chrome') ||
      agent.includes('Safari'));
  }

  async hasUser(accountName) {
    var user = await this.userdb.getUserByAccountName(accountName);
    return user != null;
  }

  async getUser(sub) {
    return await this.userdb.getUser(sub);
  }

  async addUser(sub, name, accountName) {
    return await this.userdb.addUser(sub, name, accountName);
  }

  async addApiKey(sub, name) {
    var apikey = uuidv4();
    if (await this.userdb.addApiKey(sub, name, apikey)) {
      return { keyname: name, apikey: apikey };
    }

    return null;
  }

  /**
   * Removes one or more API keys by name
   * @param {} sub 
   * @param {*} name 
   * @returns 
   */
  async removeApiKey(sub, name) {
    return await this.userdb.deleteApiKey(sub, name);
  }

  async getApiKeyUser(req) {
    let apikey = req.headers["x-api-key"];

    if (apikey == undefined) {
      return null;
    }

    var entry = await this.userdb.getSub(apikey);

    if (entry == null) {
      return null;
    }

    return await this.userdb.getUser(entry.sub);
  }

  sendError(req, res, code, message, description) {
    if (this.isBrowserRequest(req)) {
      var data = {}
      data.auth = ServerUtils.getAuthInfoFromRequest(req);
      data.code = code; 
      data.message = message; 
      data.description = description; 

      return res.status(401).render('unauthorized', {
        title: 'Unauthorized',
        data: data,
      });
    } else {
      return res.status(401).send();
    }
  }


  auth() {

    oidcConfig.issuerBaseURL = process.env.DATABUS_OIDC_ISSUER_BASE_URL;
    oidcConfig.clientID = process.env.DATABUS_OIDC_CLIENT_ID;
    oidcConfig.clientSecret = process.env.DATABUS_OIDC_SECRET;
    oidcConfig.secret = process.env.DATABUS_OIDC_SECRET;
    oidcConfig.baseURL = 'http://localhost:3000';

    oidcConfig.routes = {
      "login": false,
      "callback": Constants.DATABUS_OIDC_CALLBACK_ROUTE,
      "logout": false
    };

    if(oidcConfig.issuerBaseURL.includes(Constants.AUTH0_LOGOUT_CHECK_SEQUENCE)) {
      oidcConfig.auth0Logout = true;
    }

    oidcConfig.session = {
      rollingDuration: 60 * 24,
    };

    oidcConfig.authorizationParams = {
      response_type: "code",
      scope: "openid profile email roles"
    };

    return oidc.auth(oidcConfig);
  }

  checkAccount() {

    return async (req, res, next) => {

      if (req.databus.authenticated == false || req.databus.accountName == null) {
        response.status(401).send('Authentication failed.');
        return;
      }

      if (req.params.account != req.databus.accountName) {
        res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
        return;
      }

      return next();
    }
  }

  fetchUser() {

    return async (req, res, next) => {

      // User already fetched and authenticated
      if (req.databus != undefined && req.databus.authenticated) {
        // console.log(`PROTECT Authenticated request by \x1b[32m${req.databus.accountName}\x1b[0m: \x1b[36m${req.url}\x1b[0m`);
        return next();
      }

      req.databus = {};
      req.databus.authenticated = false;

      if (req.oidc == undefined) {
        return next();
      }

      if (!req.oidc.isAuthenticated()) {
        return next();
      }

      req.databus.authenticated = true;

      if (req.oidc.user == undefined) {
        return next();
      }

      // console.log(`user: ${JSON.stringify(req.oidc.user)}`);
      req.databus.oidc_name = req.oidc.user.name;
      req.databus.oidc_email = req.oidc.user.email;
      req.databus.sub = req.oidc.user.sub;

      if (req.oidc.accessToken) {
        req.databus.accessToken = req.oidc.accessToken;
        
        try {
            // Decode the access token WITHOUT verifying the signature
            const decodedToken = jwt.decode(req.oidc.accessToken["access_token"]);
    
            if (decodedToken && decodedToken.resource_access) {
                let access = decodedToken.resource_access
                let clientAccess = access[oidcConfig.clientID];

                if(clientAccess && clientAccess.roles) {
                  req.databus.roles = clientAccess.roles;
                }

            } else {
                console.warn("Failed to decode access token.");
            }
        } catch (error) {
            console.error("Error decoding access token:", error);
        }
      } else {
          console.warn("No access token received.");
      }

     

      // Looking up the user...
      var user = await this.userdb.getUser(req.oidc.user.sub);

      if (user != undefined) {
        req.databus.sub = user.sub;
        req.databus.accountName = user.accountName;
        req.databus.apiKeys = await this.userdb.getApiKeys(user.sub);
      }

      console.log(`PROTECT Authenticated request by \x1b[32m${req.databus.accountName}\x1b[0m: \x1b[36m${req.url}\x1b[0m`);
      return next();
    }
  }

  checkSso() {

    var self = this;

    return [async (req, res, next) => {

      if (req.oidc == undefined || !self.isBrowserRequest(req)) {

        var apiTokenUser = await self.getApiKeyUser(req);

        if (apiTokenUser != null) {
          // Api token has been found
          req.databus = {};
          req.databus.sub = apiTokenUser.sub;
          req.databus.authenticated = true;
          req.databus.accountName = apiTokenUser.accountName;
          req.databus.apiKeys = await self.userdb.getApiKeys(apiTokenUser.sub);

          return next();
        }


        return next();
      }

      res.oidc.getRedirectUri = function () {
        return getRequestUri(req) + Constants.DATABUS_OIDC_CALLBACK_ROUTE;
      }

      const silentLoginAttempted = !!(req[COOKIES] || {})[COOKIE_NAME];

      if (
        !silentLoginAttempted &&
        !req.oidc.isAuthenticated() &&
        req.accepts('html')
      ) {
        cancelSilentLogin(req, res);
        // console.log('attempting silent login');
        try {
          return res.oidc.silentLogin();
        } catch (e) {
          return next();
        }
      }

      return next();

    }, this.fetchUser()];
  }

  checkRequiredRole() {
    return (req, res, next) => {

      let requiredRole = process.env.DATABUS_OIDC_REQUIRED_ROLE;

      if(requiredRole == undefined || requiredRole === "") {
        next();
        return;
      }

      if (!req.databus || !req.databus.authenticated) {
        return this.sendError(req, res, 401, 'Authentication required.');
      }
  
      if (!req.databus.roles.includes(requiredRole)) {
        return this.sendError(req, res, 403, 'Forbidden', 'You do not have the required roles to access this resource');
      }
  
      next();
    };
  }

  
  async authenticate(request, response, next, noRedirect, responseHandler) {

    // Consider doing webid tls here 
    var apiTokenUser = await this.getApiKeyUser(request);

    if (apiTokenUser != null) {

      let requiredRole = process.env.DATABUS_OIDC_REQUIRED_ROLE;

      // Api token has been found
      request.databus = {};
      request.databus.sub = apiTokenUser.sub;
      request.databus.authenticated = true;
      request.databus.accountName = apiTokenUser.accountName;
      request.databus.roles = [ requiredRole ];
      request.databus.apiKeys = await this.userdb.getApiKeys(apiTokenUser.sub);
      return next();
    }

    // Check the token for permission when a kauth object is present
    if (request.oidc && request.oidc.isAuthenticated()) {
      return next();
    }

    // Do not require authentication for the logout route
    if (request.path == Constants.DATABUS_OIDC_LOGOUT_ROUTE) {
      return next();
    }

    // Do not require authentication for the login route
    if (request.path == Constants.DATABUS_OIDC_LOGIN_ROUTE) {
      forceLogin(request, response);
      return;
    }

    // Html requests need a redirect
    if (!noRedirect && this.isBrowserRequest(request)) {
      forceLogin(request, response);
      return;
    }

    if (responseHandler != undefined) {
      responseHandler(request, response);
      return;
    }

    // Other requests get denied
    response.status(401).send('Authentication failed.');
  }

  protect(noRedirect, responseHandler) {

    if (noRedirect == undefined) {
      noRedirect = false;
    }

    var self = this;
    return [async function (request, response, next) {
      await self.authenticate(request, response, next, noRedirect, responseHandler);
    }, this.fetchUser(), this.checkRequiredRole(), ];
  }

  protectAccount(noRedirect) {

    if (noRedirect == undefined) {
      noRedirect = false;
    }

    var self = this;
    return [async function (request, response, next) {
      await self.authenticate(request, response, next, noRedirect);
    }, this.fetchUser(), this.checkRequiredRole(), this.checkAccount()];
  }
}

module.exports = DatabusProtect;