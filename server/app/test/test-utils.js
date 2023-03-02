const DatabusUserDatabase = require("../../userdb");
const assert = require('assert');

var utils = {};

/**
 * Creates a user database connection, inserts a test user and returns the entry
 * @returns 
 */
utils.createTestUser = async function(params) {

    const db = new DatabusUserDatabase();
    db.debug = false;

    var isConnected = await db.connect();
    assert(isConnected);

    await db.deleteUser(params.SUB);
    var userAdded = await db.addUser(params.SUB, params.DISPLAYNAME, params.ACCOUNT_NAME);
    assert(userAdded);

    var apiKeyAdded = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
    assert(apiKeyAdded);

    var user = await db.getUser(params.SUB);
    assert(user.sub == params.SUB);

    return user;
}


/**
 * Deletes the test user from the user database
 */
utils.deleteTestUser = async function(params) {

   const db = new DatabusUserDatabase();
   db.debug = false;

   var isConnected = await db.connect();
   assert(isConnected);

   var isDeleted = await db.deleteUser(params.SUB);
   assert(isDeleted);

   var user = await db.getUser(params.SUB);
   assert(user == null);
}

module.exports = utils;