var express = require('express');
var constants = require('../../common/constants.js');
var sparql = require('../../common/queries/sparql');

const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const ServerUtils = require('../../common/utils/server-utils.js');
const UriUtils = require('../../common/utils/uri-utils');
var DatabusCache = require('../../common/databus-cache');
const e = require('express');

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