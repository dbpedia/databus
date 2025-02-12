var exec = require('../../execute-query');
var UriUtils = require('../../utils/uri-utils')

var instance = {};


instance.getPublisherHasAccount = async function (publisherUri, accountUri) {

  var queryOptions = {};
  queryOptions.PUBLISHER_URI = publisherUri;
  queryOptions.ACCOUNT_URI = accountUri;

  var query = exec.formatQuery(require('../sparql/get-publisher-has-account.sparql'), queryOptions);

  // console.log(query);
  
  var result = await exec.executeAsk(query);

  return result;
}

instance.getPublishersByAccount = async function (account) {
  var queryOptions = {};
  queryOptions.ACCOUNT_URI = UriUtils.createResourceUri([ account ]);

  var query = exec.formatQuery(require('../sparql/get-publishers-by-account.sparql'), queryOptions);

  // console.log(query);
  var bindings = await exec.executeSelect(query);
  return bindings;
}

/**
 * Fetch user profile by username
 */
instance.getAccount = async function (accountName) {

  try {

    // account uri creation
    var accountUri = UriUtils.createResourceUri([accountName]);

    if (accountUri == null) {
      return null;
    }

    // create query options
    var queryOptions = {};
    queryOptions.ACCOUNT_URI = accountUri;
    queryOptions.BASE_RESOURCE_URI = process.env.DATABUS_RESOURCE_BASE_URL;

    var getAccountQuery = require('../sparql/get-account.sparql');
    // fill in query options into placeholder query
    getAccountQuery = exec.formatQuery(getAccountQuery, queryOptions);

    // fire away
    var entries = await exec.executeSelect(getAccountQuery);

    if (entries.length == 0) {
      return null;
    }

    var entry = null;

    for(var e of entries) {
      if(e.account.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        entry = e;
      }
    }

    if(entry == null) {
      return null;
    }

    // post-process result
    entry.accountName = accountName;
    entry.uri = accountUri;
    entry.webIds = [];

    // console.log(entry.authorizedAccounts);

    if(entry.authorizedAccounts == undefined) {
      entry.authorizedAccounts = [];
    } else {
      entry.authorizedAccounts = entry.authorizedAccounts.split('\n');
    }

    for(var e of entries) {
      
      if(e.account.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        continue;
      }

      entry.webIds.push(e.account);
    }

    // return result
    return entry;

  } catch (err) {
    console.log(err);
    return null;
  }
}

instance.getAccountStats = async function (accountName) {

  try {

    var accountUri = UriUtils.createResourceUri([accountName]);

    if (accountUri == null) {
      return null;
    }

    var queryOptions = {};
    queryOptions.ACCOUNT_URI = accountUri;

    var query = exec.formatQuery(require('../sparql/get-account-stats.sparql'), queryOptions);

    // console.log(query);
    var bindings = await exec.executeSelect(query);


    if (bindings == null || bindings.length == 0) {
      return null;
    }

    return bindings[0];
  } catch (err) {
    console.log(err);
    return null;
  }
}

instance.getCollectionsByAccount = async function (publisherUri) {

  try {

    var queryOptions = {};
    queryOptions.PUBLISHER_URI = sanitizeUrl(publisherUri);

    var getQuery = exec.formatQuery(require('./queries/get-publisher-collections.sparql'), queryOptions);
    var bindings = await exec.executeSelect(getQuery);

    return bindings[0];
  } catch (err) {
    console.log(err);
  }
}

module.exports = instance;