const ServerUtils = require('../common/utils/server-utils');
const DatabusCache = require('../common/databus-cache');
const JsonldUtils = require('../common/utils/jsonld-utils');
const Constants = require('../common/constants');

var databaseManager = require('../common/remote-database-manager');
var sparql = require('../common/queries/sparql');
var shaclTester = require('../common/shacl/shacl-tester');
var request = require('request');
var jsonld = require('jsonld');
var fs = require('fs');
var defaultContext = require('../common/context.json');
const pem2jwk = require('pem-jwk').pem2jwk;

var constructor = require('../common/execute-construct.js');
var constructAccountQuery = require('../common/queries/constructs/construct-account.sparql');

module.exports = function (router, protector) {

  var cache = new DatabusCache(120);
  var pkeyPEM = fs.readFileSync(__dirname + '/../../keypair/public-key.pem', 'utf-8');
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
      var result = await databaseManager.save(req.params.account, targetPath, compactedGraph);

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

  router.get('/api/account/artifacts', async function (req, res, next) {
    try {

      var cacheKey = `ck_artifacts__${req.query.acount}`;

      console.log(`Getting artifacts for ${req.query.acount} with CK ${cacheKey}`);

      var artifacts = await cache.getDataCached(cacheKey,
        () => sparql.data.getArtifactsByAccount(req.query.account));

      res.status(200).send(artifacts);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/api/account/collections', async function (req, res, next) {
    try {

      var authInfo = serverUtils.getAuthInfoFromRequest(req);
      var isOwnProfile = authInfo.authenticated && authInfo.info.accountName == req.query.account;

      var cacheKey = `ck_collections_${isOwnProfile}__${req.query.account}`;

      console.log(`Getting stats for ${req.query.account} with CK ${cacheKey}`);

      var collections = await dataLoader.getDataCached(cacheKey,
        async () => await collectionsDatabase.getCollectionsByPublisher(req.query.account, !isOwnProfile));

      res.status(200).send(collections);

    } catch (err) {
      res.status(500).send(err);
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




