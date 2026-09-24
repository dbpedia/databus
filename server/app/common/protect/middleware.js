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
const { ProxyAgent } = require('proxy-agent');

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
    let redirect_uri = getRequestUri(request) + Constants.DATABUS_OIDC_CALLBACK_ROUTE;
    console.log("Sending auth request with redirect_uri: " + redirect_uri);
    return redirect_uri;
  }


  if (request.query.redirectUrl == undefined) {
    response.oidc.login();
  } else {

    console.log("Logging in with redirect: " + request.query.redirectUrl);
    
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

function authLog(step, details) {
  const extra = details === undefined ? '' : ' ' + JSON.stringify(details);
  console.log(`[AUTH ${new Date().toISOString()}] ${step}${extra}`);
}

function accountNames(accounts) {
  if (!Array.isArray(accounts)) {
    return accounts == null ? null : String(accounts);
  }

  return accounts.map(account => account && account.accountName);
}

function requestInfo(req) {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
  };
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

  async getUser(id) {
    return await this.userdb.getAccountsById(id);
  }

  async addUser(id, name, accountName) {
    return await this.userdb.addUser(id, name, accountName);
  }

  async addApiKey(accountName, name) {
    var apikey = uuidv4();
    if (await this.userdb.addApiKey(accountName, name, apikey)) {
      return { keyname: name, apikey: apikey };
    }

    return null;
  }

  /**
   * Removes one or more API keys by name
   * @param {*} name 
   * @returns 
   */
  async removeApiKey(accountName, name) {
    return await this.userdb.deleteApiKey(accountName, name);
  }

  async getApiKeyUser(req) {
    let apikey = req.headers["x-api-key"];

    if (apikey == undefined) {
      authLog('api-key header absent', requestInfo(req));
      return null;
    }

    authLog('api-key header present', { ...requestInfo(req), keyLength: apikey.length });

    var apiKey = await this.userdb.getApiKey(apikey);

    if (apiKey == null) {
      authLog('api-key lookup miss', requestInfo(req));
      return null;
    }

    authLog('api-key lookup hit', { accountName: apiKey.accountName });

    let account = await this.userdb.getAccount(apiKey.accountName);

     if (account == null) {
      authLog('api-key account missing in userdb', { accountName: apiKey.accountName });
      return null;
    }

    authLog('api-key user resolved', { userId: account.id, accountName: account.accountName });

    return {
      userId: account.id,
      accounts: [ account ]
    };
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
    oidcConfig.baseURL = process.env.DATABUS_RESOURCE_BASE_URL; 
    oidcConfig.httpAgent = { "http": new ProxyAgent(), "https": new ProxyAgent() };

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
      prompt: 'login',
      scope: "openid profile email roles"
    };
    
    if(process.env.DATABUS_OIDC_RESPONSE_TYPE != undefined) {
       oidcConfig.authorizationParams.response_type = process.env.DATABUS_OIDC_RESPONSE_TYPE;
    }

    if(oidcConfig.authorizationParams.response_type == 'code') {
      oidcConfig.authorizationParams.code_challenge_method =  "S256";
    }

    return oidc.auth(oidcConfig);
  }

  checkAccount() {

    return async (req, res, next) => {

      authLog('checkAccount', {
        ...requestInfo(req),
        authenticated: req.databus && req.databus.authenticated,
        userId: req.databus && req.databus.userId,
        oidcName: req.databus && req.databus.oidc_name,
        oidcEmail: req.databus && req.databus.oidc_email,
        accounts: accountNames(req.databus && req.databus.accounts),
        targetAccount: req.params.account,
        onBehalfOf: req.headers['x-on-behalf-of'] || null,
      });

      if (req.databus.authenticated == false || req.databus.accounts == null) {
        authLog('checkAccount denied: not authenticated', requestInfo(req));
        res.status(401).send('Authentication failed.');
        return;
      }

      const resourceUri = ServerUtils.resourceUriFromRequest(req);
      authLog('checkAccount write-access lookup', {
        userId: req.databus.userId,
        accounts: accountNames(req.databus.accounts),
        targetAccount: req.params.account,
        resourceUri: resourceUri,
      });

      if (!(await ServerUtils.hasWriteAccess(req, req.params.account, resourceUri))) {
        authLog('checkAccount denied: no write access', {
          userId: req.databus.userId,
          accounts: accountNames(req.databus.accounts),
          targetAccount: req.params.account,
          resourceUri: resourceUri,
        });
        res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
        return;
      }

      authLog('checkAccount allowed', {
        userId: req.databus.userId,
        accounts: accountNames(req.databus.accounts),
        targetAccount: req.params.account,
        resourceUri: resourceUri,
      });
      return next();
    }
  }

  getUserIdFromOIDCToken(oidc) {
     var idProperty = process.env.DATABUS_OIDC_USER_ID_PROPERTY;

      if(idProperty == undefined) {
        console.log("No id property specified. Falling back to 'sub'");
        idProperty = 'sub';
      }

      if(oidc[idProperty] == undefined) {
        console.log(`OIDC token did not contain a property '${idProperty}'. Falling back to 'sub'`);
        idProperty = 'sub';
      }

      authLog('OIDC user id resolved', {
        property: idProperty,
        userId: oidc[idProperty],
        name: oidc.name,
        email: oidc.email,
        preferredUsername: oidc.preferred_username,
      });

      return oidc[idProperty];
  }

  fetchUser() {

    return async (req, res, next) => {

      authLog('fetchUser enter', {
        ...requestInfo(req),
        hasDatabus: req.databus != undefined,
        alreadyAuthenticated: !!(req.databus && req.databus.authenticated),
        hasOidc: req.oidc != undefined,
      });

      // User already fetched and authenticated
      if (req.databus != undefined && req.databus.authenticated) {
        authLog('fetchUser skip: already authenticated', {
          ...requestInfo(req),
          userId: req.databus.userId,
          oidcName: req.databus.oidc_name,
          oidcEmail: req.databus.oidc_email,
          accounts: accountNames(req.databus.accounts),
          roles: req.databus.roles,
        });
        return next();
      }

      req.databus = {};
      req.databus.authenticated = false;

      if (req.oidc == undefined) {
        authLog('fetchUser: no OIDC context', requestInfo(req));
        return next();
      }
      
     
      if (!req.oidc.isAuthenticated()) {
        authLog('fetchUser: OIDC says not authenticated', requestInfo(req));
        return next();
      }

      req.databus.authenticated = true;
      authLog('fetchUser: OIDC authenticated', {
        ...requestInfo(req),
        userKeys: req.oidc.user && Object.keys(req.oidc.user),
        name: req.oidc.user && req.oidc.user.name,
        email: req.oidc.user && req.oidc.user.email,
        preferredUsername: req.oidc.user && req.oidc.user.preferred_username,
        sub: req.oidc.user && req.oidc.user.sub,
      });

      if (req.path == Constants.DATABUS_OIDC_LOGOUT_ROUTE) {
        authLog('fetchUser: logout route, skipping user lookup', requestInfo(req));
        return next();
      }

      if (req.oidc.user == undefined) {
        authLog('fetchUser: OIDC authenticated but user claim missing', requestInfo(req));
        return next();
      }

      req.databus.oidc_name = req.oidc.user.name;
      req.databus.oidc_email = req.oidc.user.email;
      req.databus.userId = this.getUserIdFromOIDCToken(req.oidc.user)

      if (req.oidc.accessToken) {

        req.databus.accessToken = req.oidc.accessToken;
        
        try {
            // Decode the access token WITHOUT verifying the signature
            const decodedToken = jwt.decode(req.oidc.accessToken["access_token"]);
    
            if (decodedToken && decodedToken.resource_access) {
                let access = decodedToken.resource_access;
                let clientAccess = access[oidcConfig.clientID];

                authLog('access token resource_access', {
                  userId: req.databus.userId,
                  name: req.databus.oidc_name,
                  clientId: oidcConfig.clientID,
                  resourceClients: Object.keys(access),
                  roles: clientAccess && clientAccess.roles,
                });

                if(clientAccess && clientAccess.roles) {
                  req.databus.roles = clientAccess.roles;
                }

            } else {
                authLog('access token decode produced no resource_access', {
                  userId: req.databus.userId,
                  name: req.databus.oidc_name,
                  decoded: !!decodedToken,
                  claimKeys: decodedToken && Object.keys(decodedToken),
                });
            }
        } catch (error) {
            authLog('access token decode threw', {
              userId: req.databus.userId,
              name: req.databus.oidc_name,
              message: error && error.message,
            });
        }
      } else {
          authLog('no access token on OIDC session', {
            userId: req.databus.userId,
            name: req.databus.oidc_name,
            email: req.databus.oidc_email,
          });
      }

     

      // Looking up the user...
      let userId = this.getUserIdFromOIDCToken(req.oidc.user)
      authLog('userdb lookup by id', { userId: userId, name: req.databus.oidc_name, email: req.databus.oidc_email });
      var accounts = await this.userdb.getAccountsById(userId);

      if (accounts != undefined) {
        req.databus.userId = userId;
        req.databus.accounts = accounts;
      }

      authLog('fetchUser done', {
        ...requestInfo(req),
        userId: userId,
        name: req.databus.oidc_name,
        email: req.databus.oidc_email,
        accounts: accountNames(accounts),
        accountCount: accounts && accounts.length,
        roles: req.databus.roles,
      });
      console.log(`PROTECT Authenticated request by \x1b[32m${userId}\x1b[0m (${req.databus.oidc_name}): \x1b[36m${req.url}\x1b[0m`);
      return next();
    }
  }

  checkSso() {

    var self = this;

    return [async (req, res, next) => {

      authLog('checkSso enter', {
        ...requestInfo(req),
        hasOidc: req.oidc != undefined,
        browser: self.isBrowserRequest(req),
        userAgent: req.headers['user-agent'],
      });
      
      if (req.oidc == undefined || !self.isBrowserRequest(req)) {

        var apiTokenUser = await self.getApiKeyUser(req);

        if (apiTokenUser != null) {
          req.databus = {};
          req.databus.userId = apiTokenUser.userId;
          req.databus.authenticated = true;
          req.databus.accounts = apiTokenUser.accounts;

          authLog('checkSso authenticated via api key', {
            ...requestInfo(req),
            userId: apiTokenUser.userId,
            accounts: accountNames(apiTokenUser.accounts),
          });
          return next();
        }


        authLog('checkSso: no api key user, continuing unauthenticated', requestInfo(req));
        return next();
      }

      res.oidc.getRedirectUri = function () {
        return getRequestUri(req) + Constants.DATABUS_OIDC_CALLBACK_ROUTE;
      }

      const silentLoginAttempted = !!(req[COOKIES] || {})[COOKIE_NAME];

      authLog('checkSso browser session', {
        ...requestInfo(req),
        silentLoginAttempted: silentLoginAttempted,
        oidcAuthenticated: req.oidc.isAuthenticated(),
        acceptsHtml: req.accepts('html'),
        name: req.oidc.user && req.oidc.user.name,
        email: req.oidc.user && req.oidc.user.email,
        sub: req.oidc.user && req.oidc.user.sub,
      });

      if (
        !silentLoginAttempted &&
        !req.oidc.isAuthenticated() &&
        req.accepts('html')
      ) {
        cancelSilentLogin(req, res);
        authLog('checkSso attempting silent login', requestInfo(req));
        try {
          
          return res.oidc.silentLogin();
        } catch (e) {
          authLog('checkSso silent login threw', { ...requestInfo(req), message: e && e.message });
          return next();
        }
      }

      return next();

    }, this.fetchUser()];
  }

  checkRequiredRole() {
    return (req, res, next) => {

      authLog('checkRequiredRole', {
        ...requestInfo(req),
        privateMode: process.env.DATABUS_PRIVATE_MODE,
        requiredRole: process.env.DATABUS_OIDC_REQUIRED_ROLE || null,
        authenticated: !!(req.databus && req.databus.authenticated),
        userId: req.databus && req.databus.userId,
        name: req.databus && req.databus.oidc_name,
        accounts: accountNames(req.databus && req.databus.accounts),
        roles: req.databus && req.databus.roles,
      });
      
      if (process.env.DATABUS_PRIVATE_MODE != "true") {
        next();
        return;
      }

      if (req.path == Constants.DATABUS_OIDC_LOGOUT_ROUTE) {
        next();
        return;
      }

      let requiredRole = process.env.DATABUS_OIDC_REQUIRED_ROLE;

      if(requiredRole == undefined || requiredRole === "") {
        next();
        return;
      }

      if (!req.databus || !req.databus.authenticated) {
        authLog('checkRequiredRole denied: not authenticated', requestInfo(req));
        return this.sendError(req, res, 401, 'Authentication required.');
      }
  
      if (req.databus.roles == undefined || !req.databus.roles.includes(requiredRole)) {
        authLog('checkRequiredRole denied: role missing', {
          userId: req.databus.userId,
          name: req.databus.oidc_name,
          requiredRole: requiredRole,
          roles: req.databus.roles,
        });
        return this.sendError(req, res, 403, 'Forbidden', 'You do not have the required roles to access this resource');
      }
  
      authLog('checkRequiredRole allowed', {
        userId: req.databus.userId,
        name: req.databus.oidc_name,
        requiredRole: requiredRole,
        roles: req.databus.roles,
      });
      next();
    };
  }

  
  async authenticate(request, response, next, noRedirect, responseHandler) {

    authLog('authenticate enter', {
      ...requestInfo(request),
      noRedirect: noRedirect,
      browser: this.isBrowserRequest(request),
      hasOidc: request.oidc != undefined,
      oidcAuthenticated: !!(request.oidc && request.oidc.isAuthenticated && request.oidc.isAuthenticated()),
      oidcName: request.oidc && request.oidc.user && request.oidc.user.name,
      oidcEmail: request.oidc && request.oidc.user && request.oidc.user.email,
      oidcSub: request.oidc && request.oidc.user && request.oidc.user.sub,
      onBehalfOf: request.headers['x-on-behalf-of'] || null,
    });

    // Consider doing webid tls here 
    var apiTokenUser = await this.getApiKeyUser(request);

    if (apiTokenUser != null) {

      let requiredRole = process.env.DATABUS_OIDC_REQUIRED_ROLE;

      // Api token has been found
      request.databus = {};
      request.databus.userId = apiTokenUser.userId;
      request.databus.authenticated = true;
      request.databus.accounts = apiTokenUser.accounts;
      request.databus.roles = [ requiredRole ];
      authLog('authenticate allowed via api key', {
        ...requestInfo(request),
        userId: apiTokenUser.userId,
        accounts: accountNames(apiTokenUser.accounts),
        roles: request.databus.roles,
      });
      return next();
    }

    // Check the token for permission when a kauth object is present
    if (request.oidc && request.oidc.isAuthenticated()) {
      authLog('authenticate: OIDC session already authenticated, continuing to fetchUser', {
        ...requestInfo(request),
        name: request.oidc.user && request.oidc.user.name,
        email: request.oidc.user && request.oidc.user.email,
        sub: request.oidc.user && request.oidc.user.sub,
      });
      return next();
    }

    // Do not require authentication for the logout route
    if (request.path == Constants.DATABUS_OIDC_LOGOUT_ROUTE) {
      authLog('authenticate: logout route, skipping auth', requestInfo(request));
      return next();
    }

    // Do not require authentication for the login route
    if (request.path == Constants.DATABUS_OIDC_LOGIN_ROUTE) {
      authLog('authenticate: login route, forcing login', requestInfo(request));
      forceLogin(request, response);
      return;
    }

    // Html requests need a redirect
    if (!noRedirect && this.isBrowserRequest(request)) {
      authLog('authenticate: browser request, forcing login', requestInfo(request));
      forceLogin(request, response);
      return;
    }

    if (responseHandler != undefined) {
      authLog('authenticate: custom response handler', requestInfo(request));
      responseHandler(request, response);
      return;
    }

    authLog('authenticate denied', requestInfo(request));
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