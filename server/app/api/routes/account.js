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

module.exports = function (router, protector) {

  var cache = new DatabusCache(120);
  var pkeyPEM = fs.readFileSync(__dirname + '/../../../keypair/public-key.pem', 'utf-8');
  var publicKeyInfo = pem2jwk(pkeyPEM);

  let buff = Buffer.from(publicKeyInfo.n, 'base64');
  var modulus = buff.toString('hex');
  var exponent = 65537;

  var putOrPatchAccount = async function (req, res, next, hasAccount) {
    try {

      // Get the accountName from the protected request
      var authInfo = ServerUtils.getAuthInfoFromRequest(req);
      var accountName = authInfo.info.accountName;

      if (accountName.length < 4) {
        res.status(403).send(`Account name is too short. An account name should contain at least 4 characters.\n`);
        return false;
      }

      // Check the auth info account and deny access on mismatch
      if (accountName !== req.params.account) {
        /// console.log(`AccountName mismatch: ${accountName} != ${req.params.account}\n`);
        res.status(403).send(`You cannot edit the account data in a foreign namespace\n`);
        return false;
      }

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateWebIdRDF(req.body);

      // Return failure
      if (!shaclResult.isSuccess) {
        var response = 'SHACL validation error:\n';
        for (var m in shaclResult.messages) {
          response += `>>> ${shaclResult.messages[m]}\n`
        }

        res.status(400).send(response);
        return;
      }

      var triples = await constructor.executeConstruct(req.body, constructAccountQuery);
      var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

      if (expandedGraphs.length == 0) {
        res.status(400).send(`The following construct query did not yield any triples:\n\n${constructAccountQuery}\n`);
        return;
      }

      // Expected uris
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
      var personUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}#this`;

      // Compare the specified id to the actual person uri
      var personGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSON);

      // Mismatch gives error
      if (personGraph['@id'] != personUri) {
        res.status(400).send(`The specified uri of the foaf:Person does not match the expected value. (specified: ${personGraph['@id']}, expected: ${personUri})\n`);
        return false;
      }

      // Compare the specified id to the actual person uri
      var profileGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT);

      // Mismatch gives error
      if (profileGraph['@id'] != accountUri) {
        res.status(400).send(`The specified uri of the foaf:PersonalProfileDocument graph does not match the expected value. (specified: ${profileGraph['@id']}, expected: ${accountUri})\n`);
        return false;
      }

      personGraph['http://www.w3.org/ns/auth/cert#key'] = [{
        "@type": "http://www.w3.org/ns/auth/cert#RSAPublicKey",
        "http://www.w3.org/2000/01/rdf-schema#label": "Shared Databus Public Key",
        "http://www.w3.org/ns/auth/cert#modulus": modulus,
        "http://www.w3.org/ns/auth/cert#exponent": exponent
      }];

      var insertGraphs = expandedGraphs;

      var compactedGraph = await jsonld.compact(insertGraphs, defaultContext);

      var targetPath = Constants.DATABUS_FILE_WEBID;

      // console.log(`Target path: ${targetPath}`);
      // console.log(JSON.stringify(compactedGraph));

      // Save the data using the database manager
      var result = await GstoreHelper.save(req.params.account, targetPath, compactedGraph);

      if (!result.isSuccess) {
        // return with Forbidden
        res.status(500).send('Internal database error.\n');
        return false;
      }

      // return success
      if (!hasAccount) {
        res.status(201).send('Account created successfully.\n');
      } else {
        res.status(200).send('Account saved successfully.\n');
      }

      return true;

    } catch (err) {
      // return 500 with error
      console.log('User creation failed!');
      console.log(err);
      res.status(500).send(err);
      return false;
    }
  }

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

        if ((await putOrPatchAccount(req, res, next, accountExists))) {
          await protector.addUser(req.oidc.user.sub, req.params.account, req.params.account);
        }
      }
    } else {
      putOrPatchAccount(req, res, next, accountExists);
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

    var resourceUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.params.account}`;
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




