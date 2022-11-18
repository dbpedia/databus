var fs = require('fs');
const DatabusUtils = require('../public/js/utils/databus-utils');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const ServerUtils = require('./app/common/utils/server-utils.js');
const Constants = require('./app/common/constants');

class DatabusUserDatabase {

  constructor() {
    this.addUserQuery = require('./app/common/queries/userdb/add-user.sql');
    this.addApiKeyQuery = require('./app/common/queries/userdb/add-api-key.sql');
    this.getUserQuery = require('./app/common/queries/userdb/get-user.sql');
    this.getUsersQuery = require('./app/common/queries/userdb/get-users.sql');
    this.getUserByUsernameQuery = require('./app/common/queries/userdb/get-user-by-username.sql');
    this.getSubQuery = require('./app/common/queries/userdb/get-sub.sql');
    this.deleteUserQuery = require('./app/common/queries/userdb/delete-user.sql');
    this.deleteApiKeyQuery = require('./app/common/queries/userdb/delete-api-key.sql');
    this.getApiKeysQuery = require('./app/common/queries/userdb/get-api-keys.sql');
  }

  async connect() {

    try {
      if (!fs.existsSync(__dirname + Constants.DATABUS_SQLITE_USER_DATABASE_DIR)) {
        fs.mkdirSync(__dirname + Constants.DATABUS_SQLITE_USER_DATABASE_DIR);
      }

      this.db = await open({
        filename: __dirname + Constants.DATABUS_SQLITE_USER_DATABASE_PATH,
        driver: sqlite3.Database
      });

      await this.db.get("PRAGMA foreign_keys = ON");
      await this.db.run(require('./app/common/queries/userdb/create-user-table.sql'));
      await this.db.run(require('./app/common/queries/userdb/create-api-key-table.sql'));

      if (this.debug) {
        console.log(`Connected to user database at ${__dirname + Constants.DATABUS_SQLITE_USER_DATABASE_PATH}.`);
      }
      return true;
    } catch (err) {
      if (this.debug) {
        console.log(err);
      }
      return false;
    }
  }

  /**
   * Retrieve a user
   * @param {*} sub 
   * @returns 
   */
  async getUser(sub) {
    return await this.get(this.getUserQuery, {
      SUB: sub,
    });
  }

  /**
  * Retrieve all users
  * @param {*} sub 
  * @returns 
  */
  async getUsers() {
    return await this.all(this.getUsersQuery, null);
  }

  /**
   * Retrieve a user ny username
   * @param {*} sub 
   * @returns 
   */
  async getUserByUsername(username) {
    return await this.get(this.getUserByUsernameQuery, {
      USERNAME: username,
    });
  }


  /**
   * Retrieve a sub string by apikey
   * @param {*} apikey 
   * @returns 
   */
  async getSub(apikey) {
    return await this.get(this.getSubQuery, {
      APIKEY: apikey
    });
  }

  /**
   * Adds an API key to a user 
   * @param {} sub 
   * @param {*} apikey 
   * @param {*} debugLog 
   * @returns 
   */
  async addApiKey(sub, name, apikey) {
    return await this.run(this.addApiKeyQuery, {
      SUB: sub,
      KEYNAME: name,
      APIKEY: apikey
    });
  }

  async getApiKeys(sub) {
    return await this.all(this.getApiKeysQuery, {
      SUB: sub,
    });
  }

  /**
   * Delete api key
   * @param {*} sub 
   * @returns 
   */
  async deleteApiKey(apikey) {
    return await this.run(this.deleteApiKeyQuery, {
      APIKEY: apikey,
    });
  }

  /**
  * Adds a user 
  * @param {*} sub 
  * @param {*} email 
  * @param {*} username 
  * @returns 
  */
  async addUser(sub, displayname, username) {
    return await this.run(this.addUserQuery, {
      SUB: sub,
      DISPLAYNAME: displayname,
      USERNAME: username
    });
  }

  /**
   * Delete user
   * @param {*} sub 
   * @returns 
   */
  async deleteUser(sub) {
    return await this.run(this.deleteUserQuery, {
      SUB: sub,
    });
  }


  sanitize(params) {

    for (var key in params) {

      console.log(key);
      console.log( params[key]);
      var sanitizedValue = params[key].replace("\"", "").replace(";", "");

      if (sanitizedValue != params[key]) {
        console.log(`UserDatabase: Had to sanitize SQL parameter: changed ${params[key]} to ${sanitizedValue}`);
        params[key] = sanitizedValue;
      }
    }

    return params;
  }

  /**
   * Run formatted SQL query
   * @param {*} query 
   * @param {*} params 
   * @returns 
   */
  async run(query, params) {
    try {

      var formattedQuery = ServerUtils.formatQuery(query, this.sanitize(params));

      if (this.debug) {
        console.log(formattedQuery);
      }

      await this.db.run(formattedQuery);
      return true;
    } catch (err) {

      if (this.debug) {
        console.log(err);
      }

      return false;
    }
  }

  /**
   * Run formatted SQL GET query
   * @param {*} query 
   * @param {*} params 
   * @returns 
   */
  async get(query, params) {

    try {

      var formattedQuery = ServerUtils.formatQuery(query, this.sanitize(params));

      if (this.debug) {
        console.log(formattedQuery);
      }

      return await this.db.get(formattedQuery);
    } catch (err) {

      if (this.debug) {
        console.log(err);
      }

      return null;
    }
  }

  /**
   * Run formatted SQL GET query
   * @param {*} query 
   * @param {*} params 
   * @returns 
   */
  async all(query, params) {
    try {

      var formattedQuery = ServerUtils.formatQuery(query, this.sanitize(params));

      if (this.debug) {
        console.log(formattedQuery);
      }

      return await this.db.all(formattedQuery);
    } catch (err) {

      if (this.debug) {
        console.log(err);
      }

      return null;
    }
  }
}

module.exports = DatabusUserDatabase;