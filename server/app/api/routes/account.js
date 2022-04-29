const ServerUtils = require('../../common/utils/server-utils');
const DatabusCache = require('../../common/databus-cache');
const JsonldUtils = require('../../common/utils/jsonld-utils');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');

var GstoreHelper = require('../../common/gstore-helper');
var shaclTester = require('../../common/shacl/shacl-tester');
var request = require('request');
var jsonld = require('jsonld');
var fs = require('fs');
var defaultContext = require('../../../../model/generated/context.json');
const pem2jwk = require('pem-jwk').pem2jwk;
const requestRDF = require('../../common/request-rdf');
var defaultContext = require('../../common/context.json');

var constructor = require('../../common/execute-construct.js');
var constructAccountQuery = require('../../common/queries/constructs/construct-account.sparql');
const DatabusUris = require('../../../../public/js/utils/databus-uris');

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

      // Check the auth info account and deny access on mismatch
      if (accountName !== req.params.account) {
        console.log(`AccountName mismatch: ${accountName} != ${req.params.account}\n`);
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
    
      if(expandedGraphs.length == 0) {
        res.status(400).send(`The following construct query did not yield any triples:\n\n${constructAccountQuery}\n`);
        return;
      }

      // Expected uris
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
      var personUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}#this`;

      // Compare the specified id to the actual person uri
      var personGraph = JsonldUtils.getTypedGraph(expandedGraphs, 'http://xmlns.com/foaf/0.1/Person');
     
      // Mismatch gives error
      if (personGraph['@id'] != personUri) {
        res.status(400).send(`The specified uri of the foaf:Person does not match the expected value. (specified: ${personGraph['@id']}, expected: ${personUri})\n`);
        return false;
      }

      // Compare the specified id to the actual person uri
      var profileGraph = JsonldUtils.getTypedGraph(expandedGraphs, 'http://xmlns.com/foaf/0.1/PersonalProfileDocument');
     
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

      var targetPath = 'webid.jsonld';

      console.log(`Target path: ${targetPath}`);
      console.log(JSON.stringify(compactedGraph));

      // Save the data using the database manager
      var result = await GstoreHelper.save(req.params.account, targetPath, compactedGraph);

      if (!result.isSuccess) {
        // return with Forbidden
        res.status(500).send('Internal database error.\n');
        return false;
      }
      
      // return success
      if(!hasAccount) {
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

    var accountExists = protector.hasUser(req.params.account);

    // requesting user does not have an account yet
    if (req.databus.accountName == undefined) {
    
      if(req.params.account == `sparql`) {
        res.status(403).send(`Forbidden.\n`);
      }

      if(accountExists) {
        // deny, this account name is taken
        res.status(401).send(`This account name is taken.\n`);
        return;
      } else {
        // Allow write to the account namespace
        req.databus.accountName = req.params.account;
      }
    }

    var result = await putOrPatchAccount(req, res, next, accountExists);

    if (result) {
      protector.addUser(req.oidc.user.name, req.oidc.user.sub, req.params.account);
    }
  });

  router.post('/api/account/webid/remove', protector.protect(), async function(req, res, next) {
    try {

      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var webIdUri = decodeURIComponent(req.query.uri);
    
      var path = `/${auth.info.accountName}/webid.jsonld`;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      expandedGraphs = expandedGraphs.filter(function(value, index, arr) { 
          return value['@id'] != webIdUri;
      });

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId removed from account.\n');
      return;


    } catch(err) {
      res.status(500).send(err.message);
    }
  });

  router.post('/api/account/webid/add', protector.protect(), async function(req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var webIdUri = decodeURIComponent(req.query.uri);
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${auth.info.accountName}`;
      var foafAccountPredicate = `http://xmlns.com/foaf/0.1/account`;

      console.log(`Trying to connect ${webIdUri} to ${accountUri}.`);

      var quads = await requestRDF.requestQuads(webIdUri);
      var canConnect = false;

      for(var quad of quads) {

        if(quad.subject.id != webIdUri) {
          continue;
        }

        if(quad.predicate.id != foafAccountPredicate) {
          continue;
        }

        if(quad.object.id != accountUri) {
          continue;
        }

        console.log(`Backlink found.`);
        canConnect = true;
      }

      if(!canConnect) {
        res.status(403).send('Unable to find valid backlink in WebId document.');
        return;
      }

      // Add triple to account!
      var path = `/${auth.info.accountName}/webid.jsonld`;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      for(var graph of expandedGraphs) {
        if(graph['@id'] == webIdUri) {
          res.status(403).send('WebId document already linked to this account.');
          return;
        }
      }

      var addon = {};
      addon['@id'] = webIdUri;
      addon[foafAccountPredicate] = { '@id' : accountUri, '@type' : '@id' };
      expandedGraphs.push(addon);

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId linked to account.\n');
      return;

    } catch(err) {
      res.status(400).send(err.message);
    }
  });

  router.post('/api/account/access/grant', protector.protect(), async function(req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var grantUri = decodeURIComponent(req.query.uri);
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${auth.info.accountName}`;

      console.log(`Trying to grant access to ${accountUri} to ${grantUri}.`);

      // Add triple to account!
      var path = `/webid.jsonld`;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      var policyGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.S4AC_ACCESS_POLICY);

      for(var policyGraph of policyGraphs) {

        if(policyGraph[DatabusUris.DCT_SUBJECT] == undefined) {
          continue;
        }

        if(policyGraph[DatabusUris.DCT_SUBJECT]['@id'] == grantUri) {
          res.status(403).send('This account has already been granted access.');
          return;
        }
      }

      var policy = {};
      policy['@type'] = [ DatabusUris.S4AC_ACCESS_POLICY ];
      policy[DatabusUris.S4AC_HAS_ACCESS_PRIVILEGE] = [ DatabusUris.S4AC_ACCESS_CREATE ];
      policy[DatabusUris.DCT_CREATOR] = { '@id' : accountUri };
      policy[DatabusUris.DCT_SUBJECT] = { '@id' : grantUri };

      expandedGraphs.push(policy);
      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      
      console.log(compactedGraph);
      
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);
      res.status(200).send('Access granted to account.\n');
      return;

    } catch(err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  });



  router.post('/api/account/access/revoke', protector.protect(), async function(req, res, next) {
    try {

      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var revokeUri = decodeURIComponent(req.query.uri);
    
      var path = `/webid.jsonld`;
      var accountJson = await GstoreHelper.read(auth.info.accountName, path);
      var expandedGraphs = await jsonld.flatten(await jsonld.expand(accountJson));

      expandedGraphs = expandedGraphs.filter(function(value, index, arr) { 
          return value['@id'] != webIdUri;
      });

      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);
      var result = await GstoreHelper.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId removed from account.\n');
      return;


    } catch(err) {
      res.status(500).send(err.message);
    }
  });

  router.post('/api/account/api-key/create', protector.protect(true), async function (req, res, next) {

    // Create api key for user
    var auth = ServerUtils.getAuthInfoFromRequest(req);

    if (auth.info.accountName == undefined) {
      res.status(403).send('Account name is missing.');
      return;
    }

    var keyName = decodeURIComponent(req.query.name);

    if(!DatabusUtils.isValidResourceLabel(keyName, 3, 20)) {
      res.status(403).send('Invalid API key name.');
      return;
    }

    if(auth.info.apiKeys != null && auth.info.apiKeys.length >= 10) {
      res.status(403).send('API key limit reached.');
      return;
    }

    var apiKey = protector.addApiKey(req.databus.sub, keyName); 
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
    var found = protector.removeApiKey(req.oidc.user.sub, keyName);

    if(found) {
      res.status(200).send();
    } else {
      res.status(204).send('API key with that name does not exist.');
    }
  });

  /* GET an account. */
  router.get('/:account', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = `webid.jsonld`;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    console.log(`Piping to ${options.url}`);
    request(options).pipe(res);
  });
}




