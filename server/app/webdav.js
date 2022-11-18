const webdav = require('webdav-server').v2;
const ServerUtils = require('./common/utils/server-utils');
const DatabusUtils = require("../../public/js/utils/databus-utils");
const DatabusMessage = require("./common/databus-message");
const DatabusUserDatabase = require("../userdb");

/**
 * WebDAV module
 */
class DatabusWebDAV {

  constructor() {
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
    this.webDAVServer.setFileSystem('/', new webdav.PhysicalFileSystem('/databus/server/dav/'));

    this.userdb = new DatabusUserDatabase();

    process.on('message', async function (msg) {
      if (msg.id == DatabusMessage.DATABUS_USER_ADDED) {
        this.addWebDavUser(msg.body);
      }
    });
  }

  addWebDavUser(username) {
    console.log(`Adding DAV user ${username}:${this.sessionPass}`);
    var user = this.userManager.addUser(username, this.sessionPass, false);
    this.privilegeManager.setRights(user, `/${username}/`, ['all']);
    var folderTree = {};
    folderTree[username] = webdav.ResourceType.Directory;
    this.webDAVServer.rootFileSystem().addSubTree(this.webDAVServer.createExternalContext(), folderTree);
  }

  async initialize() {
    await this.userdb.connect();
    var users = await this.userdb.getUsers();

    for (var user of users) {
      this.addWebDavUser(user.username);
    }
  }

  davAuth() {

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

      var token = btoa(`${auth.info.accountName}:${sessionPass}`)
      req.headers['Authorization'] = `Basic ${token}`;
      next("route");
    }
  }
}

module.exports = DatabusWebDAV;
