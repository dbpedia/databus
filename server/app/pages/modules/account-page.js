var sparql = require('../../common/queries/sparql');
var jsonld = require('jsonld');

const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const ServerUtils = require('../../common/utils/server-utils.js');
var DatabusCache = require('../../common/databus-cache');
const requestRDF = require('../../common/request-rdf');
var gstore = require('../../common/remote-database-manager');
var defaultContext = require('../../../../context.json');

var cache = new DatabusCache(15);

module.exports = function (router, protector) {

  router.get('/system/account', protector.protect(), async function (req, res, next) {

    var auth = ServerUtils.getAuthInfoFromRequest(req);


    if (auth.info.accountName == undefined) {
      // Let the user create an account here
      res.render('account', {
        title: 'Create Profile',
        data: {
          auth: auth
        }
      });
      return;

    } else {

      // Redirect to the specific account page
      res.redirect('/' + auth.info.accountName);
      return;
    }

  });

  router.post('/system/account/webid/connect', protector.protect(), async function(req, res, next) {

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
      var accountJson = await gstore.read(auth.info.accountName, path);

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
      var result = await gstore.save(auth.info.accountName, path, compactedGraph);

      res.status(200).send('WebId linked to account.\n');
      return;

    } catch(err) {
      res.status(400).send(err.message);
    }
  });

  router.post('/system/account/api-key/create', protector.protect(), async function (req, res, next) {

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

    var apiKey = protector.addApiKey(req.oidc.user.sub, keyName); 
    
    res.status(200).send(apiKey);
  });

  router.post('/system/account/api-key/delete', protector.protect(), async function (req, res, next) {

    // Create api key for user
    var auth = ServerUtils.getAuthInfoFromRequest(req);

    if (auth.info.accountName == undefined) {
      res.status(403).send('Account name is missing.');
      return;
    }

    var found = protector.removeApiKey(req.oidc.user.sub, req.query.key);

    if(found) {
      res.status(200).send();
    } else {
      res.status(403).send('API key not found.');
    }
  });

  router.get('/system/pages/account/stats', async function (req, res, next) {

    try {
      var accountName = req.query.account;

      var cacheKey = `ck_stats__${accountName}`;
      var stats = await cache.get(cacheKey, async () => await sparql.accounts.getAccountStats(accountName));
      res.status(200).send(stats);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/system/pages/account/artifacts', async function (req, res, next) {
    try {

      var cacheKey = `ck_artifacts__${req.query.account}`;

      console.log(`Getting artifacts for ${req.query.account} with CK ${cacheKey}`);

      var artifacts = await cache.get(cacheKey, async () =>
        await sparql.dataid.getArtifactsByAccount(req.query.account));

      res.status(200).send(artifacts);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/system/pages/account/collections', protector.protect(), async function (req, res, next) {
    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var isOwnProfile = auth.authenticated && auth.info.accountName === req.query.account;

      var cacheKey = `ck_collections_${isOwnProfile}__${req.query.account}`;

      console.log(`Getting stats for ${req.query.account} with CK ${cacheKey}`);

      var collections = await cache.get(cacheKey, async () =>
        await sparql.collections.getCollectionsByAccount(req.query.account, !isOwnProfile));

      res.status(200).send(collections);

    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  });


  router.get('/system/pages/account/stats', async function (req, res, next) {

    try {
      var accountName = req.query.account;

      var cacheKey = `ck_stats__${accountName}`;
      var stats = await cache.get(cacheKey, async () => await sparql.accounts.getAccountStats(accountName));
      res.status(200).send(stats);

    } catch (err) {
      res.status(500).send(err);
    }
  });



  router.get('/system/pages/account/activity', async function (req, res, next) {
    try {
      var accountName = req.query.account;

      var cacheKey = `ck_activity__${accountName}`;
      var activity = await cache.get(cacheKey, () => sparql.pages.getAccountActivityChartData(accountName));
      res.status(200).send(activity);

    } catch (err) {
      res.status(500).send(err);
    }
  });
}