const DatabusUserDatabase = require("../../../userdb");
const params = require('../test-user.json');
const assert = require('assert');

/**
 * Tests the user database
 */
 module.exports = async function userDatabaseTests() {

    console.log(`Testing user database.`);
 
    const db = new DatabusUserDatabase();
    db.debug = false;
 
    var result = false;
 
    result = await db.connect();
    assert(result);
 
    result = await db.getUsers();
 
    if (db.debug) {
       console.log(result);
    }
 
    await db.deleteUser(params.SUB);
 
    result = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
    assert(!result);
 
    result = await db.addUser(params.SUB, params.DISPLAYNAME, params.ACCOUNT_NAME);
    assert(result);
 
    result = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
    assert(result);
 
    result = await db.getUser(params.SUB);
    assert(result.sub == params.SUB);
 
    result = await db.deleteUser(params.SUB);
    assert(result);
 
    result = await db.getSub(params.APIKEY);
    assert(result == null);
 
    var injectUserAdded = await db.addUser("testerman_ones_sub_token;\"--".SUB, params.DISPLAYNAME, params.ACCOUNT_NAME);
    assert(!injectUserAdded);
 }