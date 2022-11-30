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
const DatabusWebDAV = require('./webdav');
const ServerUtils = require('./common/utils/server-utils');

var params = {
   SUB: "testerman_ones_sub_token",
   DISPLAYNAME: "Testerman One",
   ACCOUNT_NAME: "tester",
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
   var userAdded = await db.addUser(params.SUB, params.DISPLAYNAME, params.ACCOUNT_NAME);
   assert(userAdded);

   var apiKeyAdded = await db.addApiKey(params.SUB, params.KEYNAME, params.APIKEY);
   assert(apiKeyAdded);

   var user = await db.getUser(params.SUB);
   console.log(user);
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

   assert(user.accountName == params.ACCOUNT_NAME);
   var payload = JSON.stringify({ success: true });

   var dav = new DatabusWebDAV();

   const options = {};
   options.headers = {
      "x-api-key": params.APIKEY
   }

   var userDavDirectory = `${dav.directory}${user.accountName}`;

   if (fs.existsSync(userDavDirectory)) {
      fs.rmSync(userDavDirectory, { recursive: true, force: true });
   }

   var isDirDeleted = !fs.existsSync(userDavDirectory);

   assert(isDirDeleted);

   try {

      options.method = "MKCOL"
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/`;

      var response = await rp(options);
      assert(response == "");

      var davDirectoryExists = fs.existsSync(userDavDirectory);
      assert(davDirectoryExists);

      options.method = "PUT";
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/upload.json`;
      options.body = payload;

      response = await rp(options);
      assert(response == "");

      var fileExists = fs.existsSync(`${userDavDirectory}/test/upload.json`);
      assert(fileExists);

      options.method = "DELETE";
      options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/`;

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
   options.headers = { "x-api-key": params.APIKEY };

   // ========= GET Manifest ==========
   options.method = "GET";
   options.uri = process.env.DATABUS_RESOURCE_BASE_URL;
   options.headers['Accept'] = "text/turtle"

   var response = await rp(options);
   var manifest = require('./../manifest.ttl');

   assert(response == manifest, "Manifest cannot be retrieved.");

   // ========= PUT Account ===========
   delete options.headers['Accept'];
   var template = JSON.stringify(require('../../public/templates/json/account.json'));

   options.method = "PUT";
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;
   options.json = true;
   options.resolveWithFullResponse = true;
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT_NAME: user.accountName
   }));

   response = await rp(options);
   assert(response.statusCode == 201, 'Account could not be updated.');

   // ======= INVALID PUT Account =======
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/janfo`;

   try {
      await rp(options);
      assert(err.response.statusCode != 200, 'Able to write to janfo account. This should be forbidden');
   } catch (err) {
      assert(err.response.statusCode == 403, 'Trying to write to unowned account. 403 expected.');
   }

   // ======= GET Account ==========
   options.method = "GET";
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;
   options.headers['Accept'] = "application/ld+json"
   delete options.body;
   delete options.json;

   response = await rp(options);
   assert(response.statusCode == 200, 'Expected 200 when retrieving account.');

   options.method = "DELETE";
   response = await rp(options);
   assert(response.statusCode == 200, 'Expected 200 when deleting existing account.');

   response = await rp(options);
   assert(response.statusCode == 204, 'Expected 204 when deleting deleted account.');
   
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/janfo`;

   try {
      await rp(options);
      assert(err.response.statusCode != 200, 'Deleting unowned account should not be possible');
   } catch (err) {
      assert(err.response.statusCode == 403, 'Expected 403 when trying to delete unowned account.');
   }

   // ========= GET Account ==========

   // TODO - test full api!
   // access ACCOUNT_NAME via user.accountName


   // await apiAccountTests(user)


   await deleteTestUser();
}

async function apiAccountTests(user) {

   // const options = {};

   // options.headers = {
   //    "x-api-key": params.APIKEY,
   //    'Content-Type': 'application/json'
   // }
   // options.method = "PUT";
   // options.uri = process.env.DATABUS_RESOURCE_BASE_URL + '/' + user.accountName
   // options.headers['Accept'] = "text/plain"
   // console.log(options.uri)
   // var response = await rp(options);

   // console.log(response)
   // await setTimeout(3000);



   console.log("====BEFORE PUT=======")

   result = await axios({
      method: "PUT",
      url: process.env.DATABUS_RESOURCE_BASE_URL + '/' + user.accountName,
      data: {
         "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
         "@graph": [
            {
               "@id": `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`,
               "@type": "foaf:PersonalProfileDocument",
               "maker": `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}#this`,
               "primaryTopic": `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}#this`
            },
            {
               "@id": `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}#this`,
               "@type": [
                  "dbo:DBpedian",
                  "foaf:Person"
               ],
               "name": `${user.accountName}`,
               "rdfs:comment": "Hello Databus!",
               "account": `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`
            }
         ]
      },
      headers: {
         'Accept': 'text/plain',
         "x-api-key": params.APIKEY,
         'Content-Type': 'application/json'
      }

   })

   console.log("=======PUT RESULT=========")
   console.log(result.data)

   // let framed = await jsonld.flatten(result.data);

   // console.log("FRAMED: ", framed)
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