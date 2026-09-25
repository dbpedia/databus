var jsonld = require('jsonld');
const requestRDF = require('../../common/request-rdf');
const defaultContext = require('../../common/res/context.jsonld');
const getLinkedData = require("../../common/get-linked-data");
var cors = require('cors');
const ServerUtils = require('../../common/utils/server-utils');
const AccountUtils = require('../../common/utils/account-utils');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
var GstoreHelper = require('../../common/utils/gstore-helper');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const GstoreResource = require('../lib/gstore-resource');
const DatabusMessage = require('../../common/databus-message.js');



module.exports = function (router, protector) {


  router.post('/api/account/create', protector.protect(), async function (req, res, next) {

    let userId = req.databus.userId;
    let userdb = protector.userdb;

    if (userId == undefined) {
      return res.status(401).send('No User Id!');
    }

    let accountName = req.body.name;
    let accountLabel = req.body.label;

    if (!accountName) {
      return res.status(400).send('Missing account name or label.');
    }

    if (!accountLabel) {
      accountLabel = accountName;
    }

    var accountExists = await userdb.hasAccount(accountName);

    if (accountExists) {
      res.status(403).send(`Account name ${accountName} taken.`);
      return;
    }

    if (!await userdb.addAccount(userId, accountName)) {
      res.status(500).send('Failed to write to user database.');
      return;
    }


    try {
      let accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
      let content = await AccountUtils.createAccountGraphs(accountUri, accountName, accountLabel, null, null, null);

      let gstoreResource = new GstoreResource(accountUri, content);
      let status = await gstoreResource.save();

      console.log(status);
      res.status(200).send('Account created.');

      if (process.send != undefined) {
        process.send({
          id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
          resource: accountUri
        });
      }

    } catch (err) {
      await userdb.deleteAccount(accountName);
      res.status(500).send('Failed to write to gstore.');
    }
  });

  router.post('/api/account/update', protector.protect(), async function (req, res, next) {

    let userId = req.databus.userId;
    let userdb = protector.userdb;

    if (userId == undefined) {
      res.status(401).send('No User Id!');
      return;
    }

    const accountName = req.body.accountName;
    var existingAccount = await userdb.getAccount(accountName);

    if (existingAccount == null) {
      res.status(400).send('Account does not exist.');
      return;
    }

    if (existingAccount.id != userId) {
      res.status(403).send('You do not own this account.');
      return;
    }

    let input = req.body;

    try {
      var accountLabel = req.body.label;
      var accountStatus = req.body.status;
      var imageUrl = req.body.imageUrl;
      var secretaries = req.body.secretaries;
      let accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
      let content = await AccountUtils.createAccountGraphs(accountUri, accountName, accountLabel, imageUrl, secretaries, accountStatus);

      let gstoreResource = new GstoreResource(accountUri, content);
      let status = await gstoreResource.save();

      console.log(status);
      res.status(200).send('Account saved.');

      if (process.send != undefined) {
        process.send({
          id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
          resource: accountUri
        });
      }

    } catch (err) {
      res.status(500).send('Failed to write to gstore.');
      return;
    }
  });

  router.post('/api/account/delete', protector.protect(), async function (req, res, next) {

    // Get id of authenticated user
    let userId = req.databus.userId;

    if (userId == undefined) {
      return res.status(401).send('No User Id!');
    }

    // Get account to delete from database
    let accountName = req.body.accountName;
    let userdb = protector.userdb;
    var account = await userdb.getAccount(accountName);

    if (account == null) {
      res.status(404).send('Account does not exist.');
      return;
    }

    // Check if account belongs to authenticated
    if (account.id != userId) {
      return res.status(401).send('Account not owned.');
    }

    if (!await userdb.deleteAccount(accountName)) {
      res.status(500).send('Failed to delete user from database.');
      return;
    }

    try {
      let accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
      let gstoreResource = new GstoreResource(accountUri);

      await gstoreResource.delete();
      res.status(200).send('Account deleted.');

      if (process.send != undefined) {
        process.send({
          id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
          resource: accountUri
        });
      }

    } catch (err) {
      await userdb.addAccount(account.id, account.accountName);
      res.status(500).send('Failed to write to gstore.');
    }
  });

  router.post('/api/account/webid/remove', protector.protect(), async function (req, res, next) {
    try {

      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var webIdUri = decodeURIComponent(req.query.uri);

      var path = Constants.DATABUS_FILE_WEBID;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      expandedGraphs = expandedGraphs.filter(function (value, index, arr) {
        return value['@id'] != webIdUri;
      });

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId removed from account.\n');
      return;


    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  router.post('/api/account/webid/add', protector.protect(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var webIdUri = decodeURIComponent(req.query.uri);
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${auth.info.accountName}`;

      console.log(`Trying to connect ${webIdUri} to ${accountUri}.`);

      var quads = await requestRDF.requestQuads(webIdUri);

      var canConnect = false;

      for (var quad of quads) {

        if (quad.subject.id != webIdUri) {
          continue;
        }

        if (quad.predicate.id != DatabusUris.FOAF_ACCOUNT) {
          continue;
        }

        if (quad.object.id != accountUri) {
          continue;
        }

        // console.log(`Backlink found.`);
        canConnect = true;
      }

      if (!canConnect) {
        res.status(403).send('Unable to find valid backlink in WebId document. Make sure that the URI targets the foaf:Person of your WebId document.');
        return;
      }

      // Add triple to account!
      var path = Constants.DATABUS_FILE_WEBID;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      for (var graph of expandedGraphs) {
        if (graph[DatabusUris.JSONLD_ID] == webIdUri) {
          res.status(403).send('WebId document already linked to this account.');
          return;
        }
      }

      var accountReference = {};
      accountReference[DatabusUris.JSONLD_ID] = accountUri;

      var addon = {};
      addon[DatabusUris.JSONLD_ID] = webIdUri;
      addon[DatabusUris.FOAF_ACCOUNT] = accountReference;
      expandedGraphs.push(addon);

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

      if (process.env.DATABUS_CONTEXT_URL != null) {
        compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      }

      await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId linked to account.\n');
      return;

    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  router.post('/api/account/mods/search-extensions/add', protector.protect(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);

      // Get the request input
      var searchExtensionUri = decodeURIComponent(req.query.uri);
      var searchExtensionAdapter = req.query.adapter;

      var accountUri = UriUtils.createResourceUri([auth.info.accountName]);

      // Add triple to account!
      var path = Constants.DATABUS_FILE_WEBID;
      var accountJsonLd = await GstoreHelper.read(auth.info.accountName, path);

      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJsonLd));

      var searchExtensionGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_SEARCH_EXTENSION);

      for (var extensionGraph of searchExtensionGraphs) {

        try {

          var endpointUri = extensionGraph[DatabusUris.DATABUS_SEARCH_EXTENSION_ENDPOINT][0][DatabusUris.JSONLD_ID];

          if (endpointUri == searchExtensionUri) {
            res.status(403).send('A search extension with this URI has already been added to this account.');
            return;
          }
        } catch (err) {
          console.log(err);
        }
      }

      var accountReference = {};
      accountReference[DatabusUris.JSONLD_ID] = accountUri;

      var searchExtensionReference = {};
      searchExtensionReference[DatabusUris.JSONLD_ID] = searchExtensionUri;

      var extensionGraph = {};
      extensionGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_SEARCH_EXTENSION;
      extensionGraph[DatabusUris.DATABUS_SEARCH_EXTENSION_ADAPTER] = searchExtensionAdapter;
      extensionGraph[DatabusUris.DATABUS_SEARCH_EXTENSION_ENDPOINT] = searchExtensionReference;
      extensionGraph[DatabusUris.DATABUS_EXTENDS] = accountReference;

      // console.log(JSON.stringify(extensionGraph, null, 3));
      expandedGraphs.push(extensionGraph);

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('Search extension has been saved.\n');
      return;

    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  router.post('/api/account/mods/search-extensions/remove', protector.protect(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);

      // Get the request input
      var searchExtensionUri = decodeURIComponent(req.query.uri);

      if (searchExtensionUri == undefined || searchExtensionUri.length < 1) {
        res.status(400).send('Missing parameter uri.');
        return;
      }

      var accountJsonLd = await GstoreHelper.read(auth.info.accountName, Constants.DATABUS_FILE_WEBID);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJsonLd));

      expandedGraphs = expandedGraphs.filter(function (graph) {
        var endpointUri = JsonldUtils.getProperty(graph, DatabusUris.DATABUS_SEARCH_EXTENSION_ENDPOINT);
        return endpointUri != searchExtensionUri;
      });

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      await GstoreHelper.save(auth.info.accountName, Constants.DATABUS_FILE_WEBID, compactedGraph);

      res.status(200).send('Search extension has been removed.\n');
      return;

    } catch (err) {
      res.status(400).send(err.message);
    }

  });

  router.post('/api/account/access/grant', protector.protect(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var grantUri = decodeURIComponent(req.query.uri);
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${auth.info.accountName}`;

      console.log(`Trying to grant access to ${accountUri} to ${grantUri}.`);

      // Add triple to account!
      var path = Constants.DATABUS_FILE_WEBID;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      var policyGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.S4AC_ACCESS_POLICY);

      for (var policyGraph of policyGraphs) {

        if (policyGraph[DatabusUris.DCT_SUBJECT] == undefined) {
          continue;
        }

        if (policyGraph[DatabusUris.DCT_SUBJECT]['@id'] == grantUri) {
          res.status(403).send('This account has already been granted access.');
          return;
        }
      }

      var policy = {};
      policy[DatabusUris.JSONLD_TYPE] = [DatabusUris.S4AC_ACCESS_POLICY];
      policy[DatabusUris.S4AC_HAS_ACCESS_PRIVILEGE] = [DatabusUris.S4AC_ACCESS_CREATE];
      policy[DatabusUris.DCT_CREATOR] = { '@id': accountUri };
      policy[DatabusUris.DCT_SUBJECT] = { '@id': grantUri };

      expandedGraphs.push(policy);
      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

      // console.log(compactedGraph);

      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);
      res.status(200).send('Access granted to account.\n');
      return;

    } catch (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  });

  router.post('/api/account/access/revoke', protector.protect(), async function (req, res, next) {
    try {

      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var revokeUri = decodeURIComponent(req.query.uri);

      var path = Constants.DATABUS_FILE_WEBID;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      expandedGraphs = expandedGraphs.filter(function (value, index, arr) {
        return value['@id'] != webIdUri;
      });

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId removed from account.\n');
      return;


    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  router.post('/api/account/api-key/create', protector.protect(true), async function (req, res, next) {

    // Create api key for user
    var auth = ServerUtils.getAuthInfoFromRequest(req);
    var keyname = decodeURIComponent(req.body.keyname);
    var accountName = decodeURIComponent(req.body.accountName);

    if (!auth.info.accounts.some(a => a.accountName == accountName)) {
      res.status(403).send(`Not allowed to create API key for account '${accountName}'`);
      return;
    }

    if (!DatabusUtils.isValidResourceLabel(keyname, 3, 20)) {
      res.status(400).send('Invalid API key name. API key name should match [A-Za-z0-9\\s_()\\.\\,\\-]{3,20}');
      return;
    }

    if (auth.info.apiKeys != null && auth.info.apiKeys.length >= 10) {
      res.status(403).send('API key limit reached.');
      return;
    }

    var apiKey = await protector.addApiKey(accountName, keyname);

    if (apiKey == null) {
      res.status(400).send("Failed to create API key. You might already have an API key with that name.");
      return;
    }

    res.status(200).send(apiKey);
  });

  router.post('/api/account/api-key/delete', protector.protect(true), async function (req, res, next) {

    // Create api key for user
    var auth = ServerUtils.getAuthInfoFromRequest(req);

    var keyname = decodeURIComponent(req.body.keyname);
    var accountName = decodeURIComponent(req.body.accountName);

    var found = await protector.removeApiKey(accountName, keyname);

    if (found) {
      res.status(200).send();
    } else {
      res.status(204).send('API key with that name does not exist.');
    }
  });

  /* GET an account. */
  router.get('/:account', ServerUtils.NOT_HTML_ACCEPTED, cors(), async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.params.account}${DatabusConstants.WEBID_DOCUMENT}`;
    var template = require('../../common/queries/constructs/ld/construct-account.sparql');
    getLinkedData(req, res, next, resourceUri, template);
  });

  /* GET an account. */
  router.delete('/:account', protector.protect(), async function (req, res, next) {

    // Requesting a DELETE on an uri outside of one's namespace is rejected
    if (req.params.account != req.databus.accountName) {
      res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
      return;
    }

    var resource = await GstoreHelper.read(req.params.account, Constants.DATABUS_FILE_WEBID);

    if (resource == null) {
      res.status(204).send(`The account "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" does not exist.`);
      return;
    }

    var result = await GstoreHelper.delete(req.params.account, Constants.DATABUS_FILE_WEBID);
    var message = result.isSuccess ?
      `The account "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" has been deleted.` :
      `Internal database error. Failed to delete the account "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}".`;


    res.status(result.isSuccess ? 200 : 500).send(message);
  });


}



