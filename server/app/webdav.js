const webdav = require('webdav-server').v2;
const ServerUtils = require('./common/utils/server-utils');
const DatabusUtils = require("../../public/js/utils/databus-utils");
const path = require('path');
const fs = require('fs');

/**
 * WebDAV module
 */
class DatabusWebDAV {

  constructor(debug) {

    this.debug = debug;
    var self = this;

    this.userManager = new webdav.SimpleUserManager();
    this.privilegeManager = new webdav.SimplePathPrivilegeManager();

    var options = {
      httpAuthentication: new webdav.HTTPBasicAuthentication(this.userManager, 'Default realm'),
      privilegeManager: this.privilegeManager,
      userManager: this.userManager
    }

    this.userManager.getDefaultUser(function (defaultUser) {
      self.privilegeManager.setRights(defaultUser, `/`, ['canRead', 'canSource']);
    });

    this.sessionPass = DatabusUtils.uuidv4();
    this.webDAVServer = new webdav.WebDAVServer(options);

    this.directory = path.resolve('./') + '/dav/';

    if (this.debug) {
      console.log(`DAV directory: ${this.directory}`);
    }

    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    this.webDAVServer.setFileSystem('/', new webdav.PhysicalFileSystem(this.directory));

  }

  addWebDavUser(accountName) {

    if (this.debug) {
      console.log(`Adding DAV user ${accountName}:${this.sessionPass}`);
    }

    var user = this.userManager.addUser(accountName, this.sessionPass, false);
    this.privilegeManager.setRights(user, `/${accountName}/`, ['all']);
    var folderTree = {};
    folderTree[accountName] = webdav.ResourceType.Directory;
    this.webDAVServer.rootFileSystem().addSubTree(this.webDAVServer.createExternalContext(), folderTree);
  }

  getDavUser(accountName) {
    var self = this;
    return new Promise((resolve, reject) => {
      self.userManager.getUserByName(accountName, function (err, user) {
        if (err != null) {
          resolve(null);
        } else {
          resolve(user);
        }
      });
    });
  }

  getBasicAuthToken(accountName) {
    var token = btoa(`${accountName}:${this.sessionPass}`);
    return `Basic ${token}`
  }

  getAccountNameFromHeader(authHeader) {
    if(!authHeader.startsWith("Basic")) {
      return null;
    }

    var headerTokens = authHeader.split(" ");

    if(headerTokens.length != 2) {
      return null;
    }

    var auth = atob(headerTokens[1]);
    var authTokens = auth.split(":");

    if(authTokens.length != 2) {
      return null;
    }

    return authTokens[0];
  }

  davAuth() {

    var self = this;
    return async function (req, res, next) {
      if (req.method == "GET" || req.method == "HEAD") {
        console.log('got the get!');
        next();
        return;
      }

      /*
      if (req.headers['authorization'] != undefined) {

        var accountName = self.getAccountNameFromHeader(req.headers['authorization']);

        if(accountName == null) {
          res.status(401).send();
          return;
        }

        console.log(accountName);
        var davUser = await self.getDavUser(accountName);

        if (davUser == null) {
          self.addWebDavUser(accountName);
        }

        console.log(`Auth header already set: ${req.headers['authorization']} for ${accountName}`);
        next("route");
        return;
      }

      */ 
      var auth = ServerUtils.getAuthInfoFromRequest(req);

      if (!auth.authenticated) {
        res.status(401).send();
        return;
      }

      var davUser = await self.getDavUser(auth.info.accountName);

      if (davUser == null) {
        self.addWebDavUser(auth.info.accountName);
      }

      var token = btoa(`${auth.info.accountName}:${self.sessionPass}`)
      req.headers['Authorization'] = `Basic ${token}`;

      next("route");
    }
  }
}

module.exports = DatabusWebDAV;
