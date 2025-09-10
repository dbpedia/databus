var exec = require('../../execute-query');
var crypto = require('crypto');
const UriUtils = require('../../utils/uri-utils');
const DatabusUtils = require('../../../../../public/js/utils/databus-utils');
const QueryTemplates = require('../../../../../public/js/query-builder/query-templates');
const QueryBuilder = require('../../../../../public/js/query-builder/query-builder');

var instance = {};

instance.getCollectionQuery = async function (account, id) {

  var graphUri = UriUtils.createResourceUri([account, 'collections']);
  var collectionUri = UriUtils.createResourceUri([account, 'collections', id]);

  var queryOptions = {};
  queryOptions.COLLECTION_URI = collectionUri;
  queryOptions.PUBLISHER_COLLECTIONS_GRAPH_URI = graphUri;

  var selectQuery = require('../sparql/get-collection.sparql');
  selectQuery = exec.formatQuery(selectQuery, queryOptions);

  var entry = await exec.executeSelect(selectQuery);

  if (entry.length == 0) {
    return null;
  }

  var root = JSON.parse(unescape(entry[0].content)).root;

  return QueryBuilder.build({
    node: root,
    template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
    resourceBaseUrl: process.env.DATABUS_RESOURCE_BASE_URL
  });
}

instance.getCollectionShasum = async function (collectionUri) {
  var queryOptions = {};
  queryOptions.COLLECTION_URI = collectionUri;
  queryOptions.PUBLISHER_COLLECTIONS_GRAPH_URI = DatabusUtils.navigateUp(collectionUri);

  var selectQuery = require('../sparql/get-collection.sparql');
  selectQuery = exec.formatQuery(selectQuery, queryOptions);

  var entry = await exec.executeSelect(selectQuery);

  if (entry.length == 0) {
    return null;
  }

   var content = JSON.parse(unescape(entry[0].content));

  var query = QueryBuilder.build({
    node : content.root,
    template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
    resourceBaseUrl: process.env.DATABUS_RESOURCE_BASE_URL, 
  });

  var entries = await exec.executeSelect(query);
  var checkString = '';
  for (var i in entries) {
    checkString += entries[i].file + '_' + entries[i].file + '_';
  }

  return crypto.createHash('md5').update(checkString).digest("hex");
}

/*
instance.hasCollectionContent = function (content) {
  if (content.customQueries != undefined && content.customQueries.length > 0) {
    return true;
  }

  if (content.generatedQuery != undefined
    && content.generatedQuery.root != undefined
    && content.generatedQuery.root.childNodes != undefined
    && content.generatedQuery.root.childNodes.length > 0) {
    return true;
  }

  return false;
}
*/ 

/**
 * Returns all the collections published by a specified account
 * @param  {} publisher
 */
instance.getCollectionsByAccount = async function (accountName, onlyIssued) {

  let queryOptions = {
    ACCOUNT_URI: `${UriUtils.createResourceUri([accountName])}`
  };
  let query = exec.formatQuery(require('../sparql/get-collections-by-account.sparql'), queryOptions);

  // console.log(query);
  let bindings = await exec.executeSelect(query);

  if (bindings.length === 0) {
    return null;
  }

  let result = {};

  for (let e in bindings) {

    if (onlyIssued && bindings[e].issued === undefined) {
      continue;
    }

    bindings[e].title = unescape(bindings[e].title);
    bindings[e].abstract = unescape(bindings[e].abstract);
    bindings[e].description = unescape(bindings[e].description);
    bindings[e].accountName = accountName;
    bindings[e].content = DatabusUtils.tryParseJson(unescape(bindings[e].content));

    result[bindings[e].uri] = bindings[e];
  }


  return result;
}

module.exports = instance;