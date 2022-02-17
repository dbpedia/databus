var sparql = require('../../common/queries/sparql');
var jsonld = require('jsonld');

const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const ServerUtils = require('../../common/utils/server-utils.js');
var DatabusCache = require('../../common/databus-cache');
const requestRDF = require('../../common/request-rdf');
var gstore = require('../../common/remote-database-manager');
var defaultContext = require('../../common/context.json');

var cache = new DatabusCache(15);

module.exports = function (router, protector) {

  router.get('/app/account', protector.protect(), async function (req, res, next) {

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

  router.get('/app/account/stats', async function (req, res, next) {

    try {
      var accountName = req.query.account;

      var cacheKey = `ck_stats__${accountName}`;
      var stats = await cache.get(cacheKey, async () => await sparql.accounts.getAccountStats(accountName));
      res.status(200).send(stats);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/account/artifacts', async function (req, res, next) {
    try {

      var cacheKey = `ck_artifacts__${req.query.account}`;

      // console.log(`Getting artifacts for ${req.query.account} with CK ${cacheKey}`);

      var artifacts = await cache.get(cacheKey, async () =>
        await sparql.dataid.getArtifactsByAccount(req.query.account));

      res.status(200).send(artifacts);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/account/collections', protector.protect(), async function (req, res, next) {
    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var isOwnProfile = auth.authenticated && auth.info.accountName === req.query.account;

      var cacheKey = `ck_collections_${isOwnProfile}__${req.query.account}`;

      // console.log(`Getting stats for ${req.query.account} with CK ${cacheKey}`);

      var collections = await cache.get(cacheKey, async () =>
        await sparql.collections.getCollectionsByAccount(req.query.account, !isOwnProfile));

      res.status(200).send(collections);

    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  });


  router.get('/app/account/stats', async function (req, res, next) {

    try {
      var accountName = req.query.account;

      var cacheKey = `ck_stats__${accountName}`;
      var stats = await cache.get(cacheKey, async () => await sparql.accounts.getAccountStats(accountName));
      res.status(200).send(stats);

    } catch (err) {
      res.status(500).send(err);
    }
  });



  router.get('/app/account/activity', async function (req, res, next) {
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