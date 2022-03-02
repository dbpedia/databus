/*
 * Mod of the protect module for databus resource protection
 */

const COOKIES = require('express-openid-connect/lib/cookies');
const COOKIE_NAME = 'skipSilentLogin';

var oidc = require('express-openid-connect');
var oidcConfig = require('./oidc.json');

const weakRef = require('express-openid-connect/lib/weakCache');
var getRandomValues = require('get-random-values');

var fs = require('fs');
const Constants = require('../constants');

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function forceLogin(request, response) {

  response.oidc.getRedirectUri = function () {
    return getRequestUri(request) + '/system/callback';
  }

  if (request.query.redirectUrl == undefined) {
    response.oidc.login();
  } else {
    response.oidc.login({
      returnTo: decodeURIComponent(request.query.redirectUrl)
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

function isBrowserRequest(req) {
  var agent = req.headers['user-agent'];
  return agent != null && (agent.includes('Mozilla') || agent.includes('Chrome') ||
    agent.includes('Safari'));
}

class DatabusProtect {

  constructor(memoryStore) {

    var self = this;

    // Receive messages from the master process.
    process.on('message', function (msg) {
      if (msg.id == Constants.DATABUS_USER_CACHE_REFRESH) {
        self.updateHashTables(msg.body)
      }
    });

    process.send({
      id: Constants.DATABUS_USER_ENTRY_UPDATE,
      body: JSON.stringify({
        sub: process.pid,
        username: `user_${process.pid}`,
        name: `Name Of ${process.pid}`,
        keys: []
      })
    });

    this.oidc = oidc;
    this.oidc.debug = (str) => console.log(str);
  }

  hasUser(user) {
    return this.users.byUsername[user] != undefined;
  }

  /**
   * Gets a user by sub identifier
   * @param {*} sub 
   * @returns 
   */
  getUser(sub) {
    return this.users.bySub[sub];
  }

  addUser(name, sub, username) {

    var user = {
      name: name,
      sub: sub,
      username: username,
      keys: [],
    };

    this.users.byUsername[username] = user;
    this.users.bySub[sub] = user;

    this.saveUser(user);
  }

  /**
   * Sends a message to the master process to save and propagate user changes 
   * in the cluster
   * @param {} user 
   */
  saveUser(user) {
    process.send({
      id: Constants.DATABUS_USER_ENTRY_UPDATE,
      body: JSON.stringify(user)
    });
  }

  addApiKey(sub, name) {

    var key = uuidv4();
    var user = this.getUser(sub);

    if (user == null) {
      return null;
    }

    if (user.keys == null) {
      user.keys = [];
    }

    user.keys.push({ name: name, key: key });

    //this.users.byApiKey[key] = user;

    this.saveUser(user);
    return { name: name, key: key };
  }

  /**
   * Removes one or more API keys by name
   * @param {} sub 
   * @param {*} name 
   * @returns 
   */
  removeApiKey(sub, name) {

    try {
      var user = this.getUser(sub);

      if (user == null) {
        return false;
      }

      if (user.keys == null) {
        return false;
      }

      var keys = user.keys.filter(function (k) {
        return k.name != name;
      });

      if (keys.length != user.keys.length) {
        user.keys = keys;

        this.saveUser(user);
        return true;
      }

      return false;

    } catch (err) {
      console.log(err);
      return false;
    }
  }

  validateApiKey(req) {

    let apiKey = req.headers["x-api-key"];

    if (apiKey == undefined) {
      return null;
    }

    try {

      var user = this.users.byApiKey[apiKey];
      return user;

    } catch (err) {
      return null;
    };
  }

  updateHashTables(bySubTable) {

    this.users = {};
    this.users.bySub = bySubTable;
    this.users.byUsername = {};
    this.users.byApiKey = {};

    for (var sub in this.users.bySub) {

      var obj = this.users.bySub[sub];
      this.users.byUsername[obj.username] = obj;

      for (var k in obj.keys) {
        var entry = obj.keys[k];
        this.users.byApiKey[entry.key] = obj;
      }
    }

    console.log(`User table updated on worker ${process.pid}`);
  }

  createUserHashtable(csv) {

    var lines = csv.split("\n");
    this.users = {};
    this.users.bySub = {};
    this.users.byUsername = {};
    this.users.byApiKey = {};

    for (var i = 0; i < lines.length; i++) {

      try {

        if (lines[i].length == 0) {
          continue;
        }

        var currentline = lines[i].split(",");

        let buff = new Buffer.from(currentline[3], 'base64');
        let keysString = buff.toString('ascii');


        var obj = {
          name: currentline[0],
          sub: currentline[1],
          username: currentline[2],
          keys: JSON.parse(keysString)
        };

        this.users.bySub[obj.sub] = obj;
        this.users.byUsername[obj.username] = obj;

        for (var k in obj.keys) {
          var entry = obj.keys[k];
          this.users.byApiKey[entry.key] = obj;
        }


      } catch (err) {
        console.log(`Unable to parse user:\n${err}`);
      }
    }
  }

  auth() {

    oidcConfig.issuerBaseURL = process.env.DATABUS_OIDC_ISSUER_BASE_URL;
    oidcConfig.clientID = process.env.DATABUS_OIDC_CLIENT_ID;
    oidcConfig.secret = process.env.DATABUS_OIDC_SECRET;
    oidcConfig.baseURL = 'http://localhost:3000';

    oidcConfig.routes = {
      "login": false,
      "callback": "system/callback",
      "logout": false
    };

    oidcConfig.session = {
      rollingDuration: 60 * 24,
    };

    return oidc.auth(oidcConfig);
  }

  fetchUser() {

    return (req, res, next) => {

      // User already fetched and authenticated
      if (req.databus != undefined && req.databus.authenticated) { 
        console.log(`PROTECT Authenticated request by \x1b[32m${req.databus.accountName}\x1b[0m: \x1b[36m${req.url}\x1b[0m`);
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

      // Looking up the user...
      var user = this.getUser(req.oidc.user.sub);

      if (user != undefined) {
        req.databus.sub = user.sub;
        req.databus.accountName = user.username;
        req.databus.apiKeys = user.keys;
        // console.log(`Set databus.username of user [${req.oidc.user.sub}] to ${req.databus.accountName}`);
      }

      console.log(`PROTECT Authenticated request by \x1b[32m${req.databus.accountName}\x1b[0m: \x1b[36m${req.url}\x1b[0m`);
      return next();
    }
  }

  checkSso() {
    return [(req, res, next) => {

      if (!isBrowserRequest(req)) {
        return next();
      }

      res.oidc.getRedirectUri = function () {
        return getRequestUri(req) + '/system/callback';
      }

      const silentLoginAttempted = !!(req[COOKIES] || {})[COOKIE_NAME];

      if (
        !silentLoginAttempted &&
        !req.oidc.isAuthenticated() &&
        req.accepts('html')
      ) {
        cancelSilentLogin(req, res);
        console.log('attempting silent login');
        return res.oidc.silentLogin();
      }

      return next();

    }, this.fetchUser()];
  }

  protect(noRedirect) {

    if(noRedirect == undefined) {
      noRedirect = false;
    }

    var self = this;
    return [async function (request, response, next) {

      // console.log(`Protecting request to ${request.originalUrl}...`);
      // Consider doing webid tls here 

      var apiTokenUser = self.validateApiKey(request);

      if (apiTokenUser != null) {
        // Api token has been found
        request.databus = {};
        request.databus.sub = apiTokenUser.sub;
        request.databus.authenticated = true;
        request.databus.accountName = apiTokenUser.username;
        request.databus.apiKeys = apiTokenUser.keys;

        return next();
      }

      // Check the token for permission when a kauth object is present
      if (request.oidc && request.oidc.isAuthenticated()) {
        // console.log(`OIDC token is present - Granting access...`);
        return next();
      }


      // Html requests need a redirect
      if (!noRedirect && isBrowserRequest(request)) {
        // console.log('Accessing from Browser. Redirecting to web login...');
        // Get the user agent
        forceLogin(request, response);
        return;

      }

      //return self.oidc.requiresAuth();
      // Other requests get denied
      response.status(403).send('Access denied.\n');


    }, this.fetchUser()];
  }
}

module.exports = DatabusProtect;