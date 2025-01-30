var fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const ServerUtils = require('./app/common/utils/server-utils.js');
const Constants = require('./app/common/constants');

class DatabusUserDatabase {

  constructor(userAddedCallback) {
    this.userAddedCallback = userAddedCallback;
    this.addUserQuery = require('./app/common/queries/userdb/add-user.sql');
    this.addUserQueryPrefix = this.addUserQuery.substring(0, 10);
    this.addApiKeyQuery = require('./app/common/queries/userdb/add-api-key.sql');
    this.getUserQuery = require('./app/common/queries/userdb/get-user.sql');
    this.getUsersQuery = require('./app/common/queries/userdb/get-users.sql');
    this.getUserByAccountNameQuery = require('./app/common/queries/userdb/get-user-by-account-name.sql');
    this.getSubQuery = require('./app/common/queries/userdb/get-sub.sql');
    this.deleteUserQuery = require('./app/common/queries/userdb/delete-user.sql');
    this.deleteApiKeyQuery = require('./app/common/queries/userdb/delete-api-key.sql');
    this.getApiKeysQuery = require('./app/common/queries/userdb/get-api-keys.sql');
  }

  onTrace(query) {
    if(query.startsWith(this.addUserQueryPrefix)) {
      console.log(query);
    }
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

      if(this.userAddedCallback != undefined) {
        this.db.on('trace', this.onTrace);
      }

      await this.db.get("PRAGMA foreign_keys = ON");
      await this.db.run(require('./app/common/queries/userdb/create-user-table.sql'));
      await this.db.run(require('./app/common/queries/userdb/create-api-key-table.sql'));

      console.log(`Connected to user database at ${__dirname + Constants.DATABUS_SQLITE_USER_DATABASE_PATH}.`);
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
   * Retrieve a user ny account name
   * @param {*} sub 
   * @returns 
   */
  async getUserByAccountName(accountName) {
    return await this.get(this.getUserByAccountNameQuery, {
      ACCOUNT_NAME: accountName,
    });
  }

  async hasUser(accountName) {
    var user = await this.getUserByAccountName(accountName);
    return user != null;
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
    var result = await this.run(this.addApiKeyQuery, {
      SUB: sub,
      KEYNAME: name,
      APIKEY: apikey
    });

    return result != null && result.changes != 0;
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
  async deleteApiKey(sub, name) {
    var result = await this.run(this.deleteApiKeyQuery, {
      SUB: sub,
      NAME: name,
    });

    return result != null && result.changes != 0;
  }

  /**
  * Adds a user 
  * @param {*} sub 
  * @param {*} email 
  * @param {*} accountName 
  * @returns 
  */
  async addUser(sub, displayName, accountName) {
    var result = await this.run(this.addUserQuery, {
      SUB: sub,
      DISPLAYNAME: displayName,
      ACCOUNT_NAME: accountName
    });

    return result != null && result.changes != 0;
  }

  /**
   * Delete user
   * @param {*} sub 
   * @returns 
   */
  async deleteUser(sub) {
    var result = await this.run(this.deleteUserQuery, {
      SUB: sub,
    });

    return result != null && result.changes != 0;
  }


  isInputDangerous(params) {
    for (var key in params) {

      var value = params[key];
      if(value.includes("\"") || value.includes(";")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Run formatted SQL query
   * @param {*} query 
   * @param {*} params 
   * @returns 
   */
  async run(query, params) {
    try {

      if(this.isInputDangerous(params)) {

        if (this.debug) {
          console.log(`USERDB: Dangerous database input detected: ${JSON.stringify(params)}`);
        }

        return null;
      }

      var formattedQuery = ServerUtils.formatQuery(query, params);

      if (this.debug) {
        console.log(formattedQuery);
      }

      return await this.db.run(formattedQuery);
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
  async get(query, params) {

    try {

      if(this.isInputDangerous(params)) {

        if (this.debug) {
          console.log(`USERDB: Dangerous database input detected: ${JSON.stringify(params)}`);
        }

        return null;
      }

      var formattedQuery = ServerUtils.formatQuery(query, params);

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

      if(this.isInputDangerous(params)) {

        if (this.debug) {
          console.log(`USERDB: Dangerous database input detected: ${JSON.stringify(params)}`);
        }

        return null;
      }

      var formattedQuery = ServerUtils.formatQuery(query, params);

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