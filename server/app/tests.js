var sparql = require('./common/queries/sparql');
var assert = require('assert');

var DatabusCache = require('./common/cache/databus-cache');

const DatabusUtils = require('../../public/js/utils/databus-utils');
const UriUtils = require('./common/utils/uri-utils');
const DatabusUserDatabase = require('../userdb');


async function cacheTests() {

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
   result = await cache.get('ga', () => async function() { });
   assert(result.length > 0);
}

async function databaseTests() {

   var params = {
      SUB : "testerman_ones_sub_token",
      DISPLAYNAME : "Testerman One",
      USERNAME : "one",
      APIKEY : "000000000000000",
      KEYNAME : "testkey"
   }

   const db = new DatabusUserDatabase();
   db.debug = false;

   var result = false;

   result = await db.connect();
   assert(result);

   result = await db.getUsers();

   if(db.debug) {
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

async function utilTests() {

   // objSize
   var obj = { one : 1, two : 2 };
   assert(DatabusUtils.objSize(obj) == 2);
   assert(DatabusUtils.objSize({}) == 0);  
   assert(DatabusUtils.objSize(null) == 0);

   // uniqueList
   var list = [ 0, 1, 1, 2, 2 ];
   var uniqueList = DatabusUtils.uniqueList(list);
   assert(uniqueList.length == 3);
   assert(uniqueList[0] == 0);   
   assert(uniqueList[1] == 1);   
   assert(uniqueList[2] == 2);   

   // uriToName
   assert(UriUtils.uriToName('https://example.org/test/my-name') == 'my-name');
   assert(UriUtils.uriToName('https://example.org/test/my-name#tag') == 'tag');

}

async function sparqlTests() {

   var result;

   // ACCOUNTS

   /*
   // currently empty
   result = await sparql.accounts.getAccount('jan');
   assert(result == null);

   result = await sparql.accounts.getAccountStats('jan');
   assert(result != null);
   */

   // DATAID 

   /*
   // should not be empty
   result = await sparql.dataid.getArtifactsByAccount('jan');
   assert(DatabusUtils.objSize(result) > 0);
   
   result = await sparql.dataid.getModsByVersion('dbpedia', 'mappings', 'mappingbased-literals', '2021.03.01');
   console.log(result);

   result = await sparql.dataid.getGroupData('dbpedia', 'mappings');
   console.log(result);

   result = await sparql.dataid.getArtifactVersionsData('dbpedia', 'mappings', 'mappingbased-literals');
   console.log(result);
   assert(result.version != null);
  

   result = await sparql.dataid.getArtifactsByGroup('dbpedia', 'mappings');
   assert(result[0].artifactUri != null);
    

   result = await sparql.dataid.getVersionData('dbpedia', 'mappings', 'mappingbased-literals', '2021.03.01');
   console.log(result);
   assert(result.version != null);


   result = await sparql.dataid.getVersionDropdownData('dbpedia', 'mappings', 'mappingbased-literals', '2021.03.01');
   console.log(result);
   assert(result.formats != null);

   result = await sparql.dataid.getVersionsByArtifact('dbpedia', 'mappings', 'mappingbased-literals');
   console.log(result);

   result = await sparql.dataid.getVersion('dbpedia', 'mappings', 'mappingbased-literals', '2021.03.01');
   console.log(result); */
   // PAGES 

   // chart data 
   /*
   result = await sparql.pages.getGlobalActivityChartData();
   assert(result.length > 0);

   result = await sparql.pages.getAccountActivityChartData('jan');
   assert(result.length > 0);

   result = await sparql.pages.getPublishRankingData();
   assert(result.length > 0);

   result = await sparql.pages.getRecentUploadsData();
   assert(result != null);

   result = await sparql.pages.getVersionActions('dbpedia', 'mappings', 'mappingbased-literals', '2021.03.01');
   assert(result != null);
   assert(result.codeReference != null);

   result = await sparql.pages.getAccountData('jan');
   assert(result != null);
   assert(result.account != null);

   result = await sparql.pages.getGroupsAndArtifactsByAccount('jan');
   assert(result != null);
   assert(result.artifacts[0].artifactUri != null);
   

   result = await sparql.pages.getGroupsByAccount('jan');
   assert(result != null);
   assert(result[0].id != null);
   */
}

module.exports = async function() {
   await databaseTests();
   await cacheTests();
   await utilTests();
   await sparqlTests();
}