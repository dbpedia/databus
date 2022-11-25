var sparql = require('./common/queries/sparql');
var assert = require('assert');

var DatabusCache = require('./common/cache/databus-cache');
const path = require('path');

const DatabusUtils = require('../../public/js/utils/databus-utils');
const UriUtils = require('./common/utils/uri-utils');
const DatabusUserDatabase = require('../userdb');
const { default: axios } = require('axios');
const fs = require('fs');
const rp = require('request-promise');
const { log } = require('console');
const DatabusMessage = require('./common/databus-message');
const DatabusWebDAV = require('./webdav');

var params = {
   SUB: "testerman_ones_sub_token",
   DISPLAYNAME: "Testerman One",
   USERNAME: "tester",
   APIKEY: "000000000000000",
   KEYNAME: "testkey"
}

/**
 * Creates a user database connection, inserts a test user and returns the entry
 * @returns 
 */
async function createTestUser() {

   const db = new DatabusUserDatabase();
   db.debug = false;

   var isConnected = await db.connect();
   assert(isConnected);

   await db.deleteUser(params.SUB);
   var userAdded = await db.addUser(params.SUB, params.DISPLAYNAME, params.USERNAME);
   assert(userAdded);

   var apiKeyAdded = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
   assert(apiKeyAdded);

   var user = await db.getUser(params.SUB);
   assert(user.sub == params.SUB);

   return user;
}

/**
 * Creates a user database connection and deletes the test user
 */
async function deleteTestUser() {
   const db = new DatabusUserDatabase();
   db.debug = false;

   var isConnected = await db.connect();
   assert(isConnected);

   var isDeleted = await db.deleteUser(params.SUB);
   assert(isDeleted);

   var user = await db.getUser(params.SUB);
   assert(user == null);
}

/**
 * Tests for the DatabusCache class
 */
async function cacheTests() {

   console.log(`Testing caching.`);

   var cache = new DatabusCache(60);
   var result = {};

   // normal call
   result = await cache.get('ga', () => sparql.pages.getGlobalActivityChartData());
   assert(result.length > 0);

   // cached call - should be fast
   var startDate = Date.now().valueOf();
   result = await cache.get('ga', () => sparql.pages.getGlobalActivityChartData());
   assert((Date.now().valueOf() - startDate) < 10);
   assert(result.length > 0);

   // cached call without promise - should still return the correct result
   result = await cache.get('ga', () => async function () { });
   assert(result.length > 0);
}

/**
 * Tests for webDAV calls
 */
async function webDAVTests() {

   console.log(`Testing webDAV functions.`);

   var user = await createTestUser();

   assert(user.username == params.USERNAME);
   var payload = JSON.stringify({ success: true });

   var dav = new DatabusWebDAV();

   const options = {};
   options.headers = {
      "x-api-key": params.APIKEY
   }

   var userDavDirectory = `${dav.directory}${user.username}`;

   if (fs.existsSync(userDavDirectory)) {
      fs.rmSync(userDavDirectory, { recursive: true, force: true });
   }

   var isDirDeleted = !fs.existsSync(userDavDirectory);

   assert(isDirDeleted);

   try {

      options.method = "MKCOL"
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.username}/test/`;

      var response = await rp(options);
      assert(response == "");

      var davDirectoryExists = fs.existsSync(userDavDirectory);
      assert(davDirectoryExists);

      options.method = "PUT";
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.username}/test/upload.json`;
      options.body = payload;

      response = await rp(options);
      assert(response == "");

      var fileExists = fs.existsSync(`${userDavDirectory}/test/upload.json`);
      assert(fileExists);

      options.method = "DELETE";
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.username}/test/`;

      response = await rp(options);
      assert(response == "");

      await deleteTestUser();
      fs.rmSync(userDavDirectory, { recursive: true, force: true });

   } catch (err) {
      console.log(err);

      // Cleanup
      await deleteTestUser();
      fs.rmSync(userDavDirectory, { recursive: true, force: true });

      assert(err == null);
   }
}

/**
 * Tests the user database
 */
async function userDatabaseTests() {

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

   result = await db.addUser(params.SUB, params.DISPLAYNAME, params.USERNAME);
   assert(result);

   result = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
   assert(result);

   result = await db.getUser(params.SUB);
   assert(result.sub == params.SUB);

   result = await db.deleteUser(params.SUB);
   assert(result);

   result = await db.getSub(params.APIKEY);
   assert(result == null);

   var injectUserAdded = await db.addUser("testerman_ones_sub_token;\"--".SUB, params.DISPLAYNAME, params.USERNAME);
   assert(!injectUserAdded);
}

/**
 * Tests for util functions
 */
async function utilTests() {

   console.log(`Testing util functions.`);

   // objSize
   var obj = { one: 1, two: 2 };
   assert(DatabusUtils.objSize(obj) == 2);
   assert(DatabusUtils.objSize({}) == 0);
   assert(DatabusUtils.objSize(null) == 0);

   // uniqueList
   var list = [0, 1, 1, 2, 2];
   var uniqueList = DatabusUtils.uniqueList(list);
   assert(uniqueList.length == 3);
   assert(uniqueList[0] == 0);
   assert(uniqueList[1] == 1);
   assert(uniqueList[2] == 2);

   // uriToName
   assert(UriUtils.uriToName('https://example.org/test/my-name') == 'my-name');
   assert(UriUtils.uriToName('https://example.org/test/my-name#tag') == 'tag');
}

/**
 * Tests for API calls
 */
async function apiTests() {

   console.log(`Testing API calls.`);

   var user = await createTestUser();

   const options = {};
   options.headers = {
      "x-api-key": params.APIKEY
   }

   // Get Manifest
   options.method = "GET";
   options.uri = process.env.DATABUS_RESOURCE_BASE_URL;
   options.headers['Accept'] = "text/turtle"

   var response = await rp(options);
   var manifest = require('./../manifest.ttl');

   assert(response == manifest);

   // TODO - test full api!
   // access username via user.username





   await deleteTestUser();
}

module.exports = async function () {
   try {
      await userDatabaseTests();
      await webDAVTests();
      await cacheTests();
      await utilTests();
      await apiTests();

      console.log(`================================================`);
      console.log('Tests completed successfully.');
      console.log(`================================================`);

   } catch (err) {
      console.log(err);
      console.log(`================================================`);
      console.log('Tests completed with errors.');
      console.log(`================================================`);

   }
}