const ServerUtils = require('../../common/utils/server-utils');
const DatabusCache = require('../../common/cache/databus-cache');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');

var GstoreHelper = require('../../common/utils/gstore-helper');
var shaclTester = require('../../common/shacl/shacl-tester');
var request = require('request');
var jsonld = require('jsonld');
var fs = require('fs');
const pem2jwk = require('pem-jwk').pem2jwk;
const requestRDF = require('../../common/request-rdf');

const defaultContext = require('../../common/context.json');
const getLinkedData = require("../../common/get-linked-data");

var constructor = require('../../common/execute-construct.js');
var constructAccountQuery = require('../../common/queries/constructs/construct-account.sparql');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const publishAccount = require('../lib/publish-account');

module.exports = function (router, protector) {



  router.put('/:account', protector.protect(), async function (req, res, next) {

    // requesting user does not have an account yet
    if (req.databus.accountName == undefined) {

      // oidc not set correctly?
      if (req.oidc.user == undefined) {
        res.status(403).send(`Forbidden.\n`);
        return;
      }

      // trying to be that guy?
      if (req.params.account == `sparql`) {
        res.status(403).send(`Forbidden.\n`);
        return;
      }

      // account taken?
      var accountExists = await protector.hasUser(req.params.account);

      if (accountExists) {
        // deny, this account name is taken
        res.status(401).send(`This account name is taken.\n`);
        return;
      } else {
        // allow write to the account namespace
        req.databus.accountName = req.params.account;
        /** 
        var result = await publishAccount(req.databus.accountName, req.body);

        if (result.isSuccess) {
          await protector.addUser(req.oidc.user.sub, req.params.account, req.params.account);
          res.status(201).send(result.message);
          return;
        }

        res.status(result.statusCode).send(result.message);*/
      }
    }

    if(req.databus.accountName != req.params.account) {
      res.status(403).send(`Trying to write to an unowned account namespace.\n`);
      return;
    }

    var result = await publishAccount(req.databus.accountName, req.body);
    res.status(result.statusCode).send(result.message);
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

    if (auth.info.accountName == undefined) {
      res.status(403).send('Account name is missing. Please claim an account name first.');
      return;
    }

    var keyName = decodeURIComponent(req.query.name);

    if (!DatabusUtils.isValidResourceLabel(keyName, 3, 20)) {
      res.status(403).send('Invalid API key name. API key name should match [A-Za-z0-9\\s_()\\.\\,\\-]{3,20}');
      return;
    }

    if (auth.info.apiKeys != null && auth.info.apiKeys.length >= 10) {
      res.status(403).send('API key limit reached.');
      return;
    }

    var apiKey = await protector.addApiKey(req.databus.sub, keyName);

    if (apiKey == null) {
      res.status(400).send("Failed to create API key. You might already have an API key with that name.");
      return;
    }

    res.status(200).send(apiKey);
  });

  router.post('/api/account/api-key/delete', protector.protect(true), async function (req, res, next) {

    // Create api key for user
    var auth = ServerUtils.getAuthInfoFromRequest(req);

    if (auth.info.accountName == undefined) {
      res.status(403).send('Account name is missing.');
      return;
    }

    var keyName = decodeURIComponent(req.query.name);
    var found = await protector.removeApiKey(req.databus.sub, keyName);

    if (found) {
      res.status(200).send();
    } else {
      res.status(204).send('API key with that name does not exist.');
    }
  });

  /* GET an account. */
  router.get('/:account', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

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



