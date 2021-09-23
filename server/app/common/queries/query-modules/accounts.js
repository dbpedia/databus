var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL;

var exec = require('../../execute-query');
var fs = require('fs');
var path = require('path')

var ServerUtils = require('../../utils/server-utils');
var UriUtils = require('../../utils/uri-utils')
var DatabusUtils = require('../../../../../public/js/utils/databus-utils');

var instance = {};


instance.getPublisherHasAccount = async function (publisherUri, accountUri) {

  var queryOptions = {};
  queryOptions.PUBLISHER_URI = publisherUri;
  queryOptions.ACCOUNT_URI = accountUri;

  var query = exec.formatQuery(require('../sparql/get-publisher-has-account.sparql'), queryOptions);
  var result = await exec.executeAsk(query);

  return result;
}

instance.getPublishersByAccount = async function (account) {
  var queryOptions = {};
  queryOptions.ACCOUNT_URI = UriUtils.createResourceUri([ account ]);

  var query = exec.formatQuery(require('../sparql/get-publishers-by-account.sparql'), queryOptions);

  console.log(query);
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
    var entry = await exec.executeSelect(getAccountQuery);

    if (entry.length == 0) {
      return null;
    }

    // post-process result
    entry[0].accountName = accountName;
    entry[0].uri = accountUri;

    // return result
    return entry[0];

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

    console.log(query);
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

instance.constructWebId = async function (username) {

  var profileData = await users.getProfileData(username);

  if (profileData == null) {
    return null;
  }

  console.log(profileData);

  var templateValues = {};
  templateValues.USER_URI = profileData.uri;
  templateValues.USER_NAME = profileData.label;
  templateValues.USER_IMG_URL = profileData.imageUrl;
  templateValues.USER_PUB_KEY_EXP = 3452345;
  templateValues.USER_PUB_KEY_MOD = "C65A227E835DE41C59644545C437646F1F3CBD0EE9695144209089ABB0EA228BE1D7CCBB905F409BD8A9B0F946A5AEB6B1D3E565A6F471A10BB8A1014C4E934CB6C2F9D2D4FB9C7FB4757FA9F831F75F72F1E74E09A64C4BFD49E4C402B25E8255C5BCDB3341F9FD0F5E0260EAF3AA3E7EA8A9663E9CCCCAADA363E8E5072DBDBA432CA273E5C933D";

  var template = fs.readFileSync(path.resolve('./app/query-modules/users/webid-template.ttl'), 'utf8');
  var webid = exec.formatQuery(template, templateValues);

  return webid;
}


module.exports = instance;