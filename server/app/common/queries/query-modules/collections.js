var exec = require('../../execute-query');
var crypto = require('crypto');
var constants = require('../../constants');
var sanitizeUrl = require('@braintree/sanitize-url').sanitizeUrl;
var DatabusResponse = require('../../../../../public/js/utils/databus-response');
var QueryBuilder = require('../../../../../public/js/collections/query-builder');
const ServerUtils = require('../../utils/server-utils');
const UriUtils = require('../../utils/uri-utils');
const DatabusUtils = require('../../../../../public/js/utils/databus-utils');

var instance = {};

/**
 * Collection GET. Retrieves a collection with formatted fields
 * @param  {} collectionUri
 */
instance.getCollection = async function(account, id) {
    let queryOptions = {
        COLLECTION_URI : UriUtils.createResourceUri([account, 'collections', id]),
        PUBLISHER_COLLECTIONS_GRAPH_URI : UriUtils.createResourceUri([account, 'collections'])
    };
    let selectQuery = exec.formatQuery(require('../sparql/get-collection.sparql'), queryOptions);
    console.log(selectQuery);
    let entry = await exec.executeSelect(selectQuery);

    if(entry.length === 0) {
        return null;
    }
    
    entry[0].uri = queryOptions.COLLECTION_URI;
    entry[0].label = unescape(entry[0].label);
    entry[0].abstract = unescape(entry[0].abstract);
    entry[0].description = unescape(entry[0].description);
    entry[0].content = DatabusUtils.tryParseJson(unescape(entry[0].content));

    return entry[0];
}

instance.getCollectionStatistics = async function(collectionUri) {

    let queryOptions = {
        COLLECTION_URI : collectionUri,
        PUBLISHER_COLLECTIONS_GRAPH_URI : DatabusUtils.navigateUp(collectionUri) //collectionUri+"/data.jsonld" //
    };

    let selectQuery = exec.formatQuery(require('../sparql/get-collection.sparql'), queryOptions);

    console.log(`Query: ${selectQuery}`);
    let entry = await exec.executeSelect(selectQuery);

    if(entry.length === 0) {
        return null;
    }

    let content = DatabusUtils.tryParseJson(unescape(entry[0].content));

    let queryBuilder = new QueryBuilder();
    let wrapperQuery = require('../sparql/file-statistics-query-template.sparql');
    let query = queryBuilder.createCollectionQuery(content, wrapperQuery, '%COLLECTION_QUERY%');

    console.log(`More query: ${query}`);
    let entries = await exec.executeSelect(query);

    if(entries.length === 0) {
        return null;
    }

    let result = {
        fileCount : entries.length,
        licenses : [],
        files : [],
        size : 0 };

    for(let i in entries) {
        let element = entries[i];

        result.size += parseInt(element.size);
        result.licenses.push(element.license);
        result.files.push(element);
    }

    result.licenses = result.licenses.filter(function(item, pos, self) {
        return self.indexOf(item) === pos;
    });

    return result;
}

instance.getCollectionQuery = async function(account, id) {

     

    var graphUri = UriUtils.createResourceUri([account, 'collections']);
    var collectionUri = UriUtils.createResourceUri([account, 'collections', id]);

    var queryOptions = {};
    queryOptions.COLLECTION_URI = collectionUri;
    queryOptions.PUBLISHER_COLLECTIONS_GRAPH_URI = graphUri;

    var selectQuery = require('../sparql/get-collection.sparql');
    selectQuery = exec.formatQuery(selectQuery, queryOptions);

    var entry = await exec.executeSelect(selectQuery);

    if(entry.length == 0) {
        return null;
    }
    
    entry[0].content = DatabusUtils.tryParseJson(unescape(entry[0].content));

    var queryBuilder = new QueryBuilder();
    return queryBuilder.createCollectionQuery(entry[0].content);
}

instance.getCollectionShasum = async function(collectionUri) {
    var queryOptions = {};
    queryOptions.COLLECTION_URI = collectionUri;
    queryOptions.PUBLISHER_COLLECTIONS_GRAPH_URI = DatabusUtils.navigateUp(collectionUri);

    var selectQuery = require('./queries/get-collection.sparql');
    selectQuery = exec.formatQuery(selectQuery, queryOptions);

    var entry = await exec.executeSelect(selectQuery);

    if(entry.length == 0) {
        return null;
    }

    entry[0].content = DatabusUtils.tryParseJson(unescape(entry[0].content));

    var queryBuilder = new QueryBuilder();
    var query = queryBuilder.createCollectionQuery(entry[0].content);

    var entries = await exec.executeSelect(query);
    var checkString = '';
    for(var i in entries) {
        checkString += entries[i].file + '_' + entries[i].file + '_';
    }

    return crypto.createHash('md5').update(checkString).digest("hex");
}

instance.hasCollectionContent = function(content) {
    if(content.customQueries != undefined && content.customQueries.length > 0) {
        return true;
    }

    if(content.generatedQuery != undefined
        && content.generatedQuery.root != undefined
        && content.generatedQuery.root.childNodes != undefined
        && content.generatedQuery.root.childNodes.length > 0) {
        return true;
    }

    return false;
}
/**
 * Returns all the collections published by a specified account
 * @param  {} publisher
 */
instance.getCollectionsByAccount = async function(accountName, onlyIssued) {

    let queryOptions = {
        ACCOUNT_URI : `${UriUtils.createResourceUri([ accountName ])}#this`
    };
    let query = exec.formatQuery(require('../sparql/get-collections-by-account.sparql'), queryOptions);
    let bindings = await exec.executeSelect(query);

    if(bindings.length === 0) {
        return null;
    }

    let result = {};

    for(let e in bindings) {

        if(onlyIssued && bindings[e].issued === undefined) {
            continue;
        }

        bindings[e].label = unescape(bindings[e].label);
        bindings[e].abstract = unescape(bindings[e].abstract);
        bindings[e].description = unescape(bindings[e].description);
        bindings[e].content = DatabusUtils.tryParseJson(unescape(bindings[e].content));
        result[bindings[e].uri] = bindings[e];
    }

    return result;
}

module.exports = instance;