const userDatabaseTests = require('./methods/user-database-tests');
const utilTests = require('./methods/util-tests');
const webdavTests = require('./methods/webdav-tests');
const cacheTests = require('./methods/cache-tests');
const { accountTests, createTestAccount, deleteTestAccount } = require('./methods/api/account-tests');
const tractateTests = require('./methods/api/tractate-tests');
const { createTestUser, deleteTestUser } = require('./test-utils');
const generalTests = require('./methods/api/general-tests');
const groupTests = require('./methods/api/group-tests');

module.exports = async function () {
   try {

      // Base
      await userDatabaseTests();
      await utilTests();
      await webdavTests();
      await cacheTests();

      // Account
      await accountTests();

      // Create user and account for API tests
      await createTestUser();
      await createTestAccount();

      // API
      await tractateTests();
      await groupTests();
      await generalTests();

      await deleteTestAccount();
      await deleteTestUser();

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

/**
 * Tests for API calls
 
async function apiTests() {

   console.log(`Testing API calls.`);

   var user = await createTestUser();

   await manifestTest();

   await accountTests(user);

   await deleteTestUser();
}

/*

async function accountTests(user) {

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   // ========= PUT Account ===========
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;
   options.method = "PUT";
   options.json = true;

   const template = JSON.stringify(require('../../../public/templates/json/account.json'));

   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT_NAME: user.accountName
   }));


   response = await rp(options);
   assert(response.statusCode == 201, 'Account could not be updated.');

   // ======= INVALID PUT Account =======
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/janfo`;

   try {
      response = await rp(options);
      assert(response.statusCode != 200, 'Able to write to janfo account. This should be forbidden');
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
   var template = JSON.stringify(require('../../../public/templates/json/dataid.json'));

   options.method = "POST";
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}` + '/api/publish';
   options.json = true;
   options.resolveWithFullResponse = true;
   options.body = JSON.parse(ServerUtils.formatTemplate(template, {
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
   var template = JSON.stringify(require('../../../public/templates/json/dataid.json'));

   var testMetadata = JSON.parse(ServerUtils.formatTemplate(template, {
      DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
      ACCOUNT: user.accountName,
      GROUP: "testgroup",
      ARTIFACT: "testartifact",
      VERSION: "1000"
   }));

   options.method = "POST";
   options.headers = { 'Accept': 'text/plain' }
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/canonicalize`;
   options.json = true;
   options.body = testMetadata;

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not generate Databus Tractate v1.');

   // ========= Validate Databus Tractate v1 ===========

   // Expand graph, autocomplete, create proof
   testMetadata = await jsonld.flatten(await jsonld.expand(testMetadata));
   autocomplete(testMetadata);

   options.body[DatabusUris.JSONLD_GRAPH][DatabusUris.SEC_PROOF] = suite.createProof(testMetadata);

   delete options.headers['Accept'];

   options.headers = { 'Accept': 'application/json' }
   options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/verify`;

   response = await rp(options);

   assert(response.statusCode == 200 && response.body.success == true, response.body.message);

}

async function groupTests(user) {
   console.log("GROUPTESTS")

   const options = {
      "headers": { "x-api-key": params.APIKEY },
      "resolveWithFullResponse": true
   };

   const group = "testgroup"

   // ========= Create Group ===========
   let template = JSON.stringify(require('../../../public/templates/json/group.json'));

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
   options.headers = { "x-api-key": params.APIKEY };

   response = await rp(options);
   assert(response.statusCode == 200, 'Could not delete group.');

   // ========= Get Group ===========
   delete options.headers;
   delete options.body;
   options.headers = { 'Accept': 'application/ld+json' }
   options.method = "GET";

   response = await rp(options);
   assert(response.statusCode == 404, 'Group has not been deleted.');
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
   let template = JSON.stringify(require('../../../public/templates/json/artifact.json'));

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
   let template = JSON.stringify(require('../../../public/templates/json/artifact.json'));

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
   let template = JSON.stringify(require('../../../public/templates/json/collection.json'));

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
*/

