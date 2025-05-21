var sparql = require('../../common/queries/sparql');
var jsonld = require('jsonld');

const ServerUtils = require('../../common/utils/server-utils.js');
var DatabusCache = require('../../common/cache/databus-cache');
const { executeAsk } = require('../../common/execute-query');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const UriUtils = require('../../common/utils/uri-utils');

var cache = new DatabusCache(15);

module.exports = function (router, protector) {

  router.get('/app/user', protector.protect(), async function (req, res, next) {

    let userdb = protector.userdb;
    let sub = req.databus.sub;

    var auth = ServerUtils.getAuthInfoFromRequest(req);

    let accounts = await userdb.getAccountsBySub(sub);
    let apiKeys = await userdb.getApiKeys(sub);

    console.log(accounts);

    res.render('user-settings', {
      title: 'User Settings',
      data: {
        auth: auth,
        accounts: accounts,
        apiKeys: apiKeys,
      }
    });
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
        await sparql.dataid.getGroupsAndArtifactsByAccount(req.query.account));

      res.status(200).send(artifacts);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/account/content', async function (req, res, next) {
    try {

      var cacheKey = `ck_content__${req.query.account}`;

      var content = await cache.get(cacheKey, async () => {
        return {
          groups: await sparql.dataid.getGroupsByAccount(req.query.account),
          artifacts: await sparql.dataid.getArtifactsByAccount(req.query.account),
          versions: await sparql.dataid.getVersionsByAccount(req.query.account)
        };
      });

      res.status(200).send(content);

    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/account/collections', protector.checkSso(), async function (req, res, next) {
    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var isOwnProfile = auth.authenticated && auth.info.accountName === req.query.account;

      var cacheKey = `ck_collections_${isOwnProfile}__${req.query.account}`;

      console.log(`Getting collections for ${req.query.account} with CK ${cacheKey}`);

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

  router.get('/app/account/history', async function (req, res, next) {
    try {
      var activity = await sparql.pages.getAccountHistory(req.query.accountName);
      res.status(200).send(activity);
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