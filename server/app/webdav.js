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

    if(this.debug) {
      console.log(`DAV directory: ${this.directory}`);
    }

    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    this.webDAVServer.setFileSystem('/', new webdav.PhysicalFileSystem(this.directory));

  }

  addWebDavUser(username) {

    if(this.debug) {
      console.log(`Adding DAV user ${username}:${this.sessionPass}`);
    }

    var user = this.userManager.addUser(username, this.sessionPass, false);
    this.privilegeManager.setRights(user, `/${username}/`, ['all']);
    var folderTree = {};
    folderTree[username] = webdav.ResourceType.Directory;
    this.webDAVServer.rootFileSystem().addSubTree(this.webDAVServer.createExternalContext(), folderTree);
  }

  getDavUser(username) {
    var self = this;
    return new Promise((resolve, reject) => {
      self.userManager.getUserByName(username, function(err, user) {
        if(err != null) {
          resolve(null);
        } else {
          resolve(user);
        }
      });
    });
  }

  davAuth() {

    var self = this;
    return async function (req, res, next) {
      if (req.method == "GET" || req.method == "HEAD") {
        next("route");
        return;
      }

      var auth = ServerUtils.getAuthInfoFromRequest(req);

      if (!auth.authenticated) {
        res.status(401).send();
        return;
      }

      var davUser = await self.getDavUser(auth.info.accountName);

      if(davUser == null) {
        self.addWebDavUser(auth.info.accountName);
      }

      var token = btoa(`${auth.info.accountName}:${self.sessionPass}`)
      req.headers['Authorization'] = `Basic ${token}`;

      next("route");
    }
  }
}

module.exports = DatabusWebDAV;
