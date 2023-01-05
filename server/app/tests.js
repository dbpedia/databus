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

   await manifestTest();

   await accountTests(user);

   await deleteTestUser();
}

async function manifestTest() {

   // ========= GET Manifest ==========
   const options = {};
   options.headers = { "x-api-key": params.APIKEY };

   options.method = "GET";
   options.uri = process.env.DATABUS_RESOURCE_BASE_URL;
   options.headers['Accept'] = "text/turtle"

   var response = await rp(options);
   var manifest = require('./../manifest.ttl');

   assert(response == manifest, "Manifest cannot be retrieved.");
}


async function accountTests(user) {

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   // ========= PUT Account ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;
   options.method = "PUT";
   options.json = true;

   const template = JSON.stringify(require('../../public/templates/json/account.json'));

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
   delete options.body;
   delete options.json;

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;
   options.method = "GET";
   options.headers['Accept'] = "application/ld+json"

   response = await rp(options);
   assert(response.statusCode == 200, 'Expected 200 when retrieving account.');


   // ========= EXECUTE OTHER TESTS ==========
   await apiKeyTests()
   await webidTests()
   await tractateTests(user)
   await publishTest(user)
   await groupTests(user)
   await artifactTests(user)
   await dataidTests(user)
   await collectionTests(user)
   // ========= EXECUTE OTHER TESTS ==========


   // ========= DELETE Account ==========
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
}

async function apiKeyTests() {

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   // ========= Create API Key ===========
   let keyName = "testkey2"

   options.method = "POST";
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/account/api-key/create?name=${keyName}`;

   console.log(options)

   response = await rp(options);

   assert(response.statusCode == 200, 'API key could not be created.');

   // ========= Delete API Key ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/account/api-key/delete?name=${keyName}`;

   response = await rp(options);
   assert(response.statusCode == 200, 'API key could not be deleted.');
}

async function webidTests() {
   
   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true,
      "method": "POST"
   };

      // ========= POST WebId ===========
   let webid = encodeURIComponent('https://holycrab13.github.io/webid.ttl')
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/account/webid/add?uri=${webid}`;

   response = await rp(options);
   assert(response.statusCode == 200, 'WebId could not be posted.');

   // ========= Remove WebId ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/account/webid/remove?uri=${webid}`;

   response = await rp(options);
   assert(response.statusCode == 200, 'WebId could not be posted.');


}

async function publishTest(user) {
   console.log("PUBLISH TESTS")
   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   // ========= Publish ===========
   let group = "cleaned"
   let artifact = "geonames"
   let version = "2022-02-09"
   var template2 = JSON.stringify(require('../../public/templates/json/publish.json'));

   options.method = "POST";
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + '/api/publish';
   options.json = true;
   options.resolveWithFullResponse = true;
   options.body = JSON.parse(ServerUtils.formatTemplate(template2, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      GROUP: group,
      ARTIFACT: artifact,
      VERSION: version
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Metadata could not be published.');
}

async function tractateTests(user) {
   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   // ========= Generate Databus Tractate v1 ===========
   template = JSON.stringify(require('../../public/templates/json/canonicalize.json'));

   options.method = "POST";
   options.headers = { 'Accept': 'text/plain' }
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/tractate/v1/canonicalize`;
   options.json = true;
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not generate Databus Tractate v1.');

   // ========= Validate Databus Tractate v1 ===========
   template = JSON.stringify(require('../../public/templates/json/tractate_v1.json'));
   
   delete options.headers['Accept'];

   options.headers = { 'Accept': 'application/json' }
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/tractate/v1/verify`;

   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName
   }));

   response = await rp(options);

   assert(response.statusCode == 200 && response.body.success == true, 'Could not verify Databus Tractate v1.');

}

async function groupTests(user) {
   console.log("GROUPTESTS")

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   const group = "testgroup"

   // ========= Create Group ===========
   let template = JSON.stringify(require('../../public/templates/json/group.json'));

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/${group}`;
   options.method = "PUT";
   options.json = true;
   
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      GROUP: group
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Group could not be created.');

   // ========= Get Group ===========
   delete options.headers;
   delete options.body;

   options.method = "GET";
   options.headers = { 'Accept': 'application/ld+json' }

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get group.');
   
   // ========= Delete Group ===========
   delete options.headers;

   options.method = "DELETE";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not delete group.');
}

async function artifactTests(user) {
   console.log("ARTIFACTTESTS")

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   const group = "testgroup"
   const artifact = "testartifact"

   // ========= Create Artifact ===========
   let template = JSON.stringify(require('../../public/templates/json/artifact.json'));

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/${group}/${artifact}`;
   options.method = "PUT";
   options.json = true;
   
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      GROUP: group,
      ARTIFACT: artifact
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Artifact could not be created.');

   // ========= Get Artifact ===========
   delete options.headers;
   delete options.body;

   options.method = "GET";
   options.headers = { 'Accept': 'application/ld+json' }

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get artifact.');
   
   // ========= Delete Artifact ===========
   delete options.headers;

   options.method = "DELETE";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not delete artifact.');
}

async function dataidTests(user) {
   console.log("DATAIdTESTS")

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   const group = "testgroup"
   const artifact = "testartifact"
   const version = "2022-02-09"

   // ========= Create DataId ===========
   let template = JSON.stringify(require('../../public/templates/json/artifact.json'));

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/${group}/${artifact}/${version}`;
   options.method = "PUT";
   options.json = true;
   
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      GROUP: group,
      ARTIFACT: artifact,
      VERSION: version
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Artifact could not be created.');

   // ========= Get DataId ===========
   delete options.headers;
   delete options.body;

   options.method = "GET";
   options.headers = { 'Accept': 'application/ld+json' }

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get artifact.');

   // ========= Get File ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/${group}/${artifact}/${version}/geonames.ttl`;
   delete options.headers;

   options.method = "GET";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get File.');
   
   // ========= Delete DataId ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/${group}/${artifact}/${version}`;
   delete options.headers;

   options.method = "DELETE";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not delete artifact.');
}

async function collectionTests(user) {
   console.log("CollectionTESTS")

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   const collection = "testCollection"

   // ========= Create Collection ===========
   let template = JSON.stringify(require('../../public/templates/json/collection.json'));

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/collections/${collection}`;
   options.method = "PUT";
   options.json = true;
   
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      COLLECTION: collection
   }));

   response = await rp(options);
   assert(response.statusCode == 200, 'Collection could not be created.');

   // ========= Get Collection ===========
   delete options.headers;
   delete options.body;

   options.method = "GET";
   options.headers = { 'Accept': 'application/ld+json' }

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get Collection.');

   // ========= Get MD5Hash ===========
   let collectionURI = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}/collections/${collection}`

   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/api/collection/md5hash?uri=${encodeURIComponent(collectionURI)}`;
   delete options.headers;

   options.method = "GET";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not get MD5 Hash of Collection.');
   
   // ========= Delete Collection ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + `/${user.accountName}/collections/${collection}`;

   options.method = "DELETE";

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not delete Collection.');
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