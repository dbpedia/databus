var sparql = require('../../common/queries/sparql');
var request = require('request');

const DatabusCache = require('../../common/cache/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');
const Constants = require('../../common/constants');

module.exports = function (router, protector) {

  var cache = new DatabusCache(60);

  router.get('/:account', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var accountData = await sparql.accounts.getAccount(req.params.account);

      if (accountData == null) {
        next('route');
        return; 
      }

      res.render('account', {
        title: accountData.label,
        data: {
          auth: auth,
          username: req.params.account,
          profile: accountData,
        }
      });


    } catch (err) {
      console.log(err);
      next('route');
    }
  });

  router.get('/:account/collections', function (req, res, next) {
    return res.redirect('/' + req.params.account + '#collections');
  });

  router.get('/:account/services', function (req, res, next) {
    return res.redirect('/' + req.params.account + '#services');
  });

  router.get('/:account/apps', function (req, res, next) {
    return res.redirect('/' + req.params.account + '#apps');
  });
  
  router.get('/:account/:group', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {
   
    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let groupData = await sparql.dataid.getGroup(req.params.account, req.params.group);

      if (groupData == null) {
        next('route');
        return; 
      }

      let artifactData = await sparql.dataid.getArtifactsByGroup(req.params.account, req.params.group);

      res.render('group', {
        title: groupData.label,
        data: { auth: auth, group: groupData, artifacts: artifactData }
      });

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/collections/:collection', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {
    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let collectionData = await sparql.collections.getCollection(req.params.account, req.params.collection);

      if (collectionData == null) {
        next('route');
        return;
      }

      if (collectionData.issued === undefined &&
        (!auth.authenticated || req.params.publisher !== auth.info.username)) {
        res.status(404).send('This collection has been hidden by the author.');
        return;
      }

      res.render('collection', {
        title: collectionData.title,
        data: { collection: collectionData, auth: auth }
      });
    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact', protector.checkSso(), async function (req, res, next) {

    if(req.params.group == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      next('route');
      return;
    }

    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let versionsData = await sparql.dataid.getVersionsByArtifact(req.params.account, req.params.group, req.params.artifact);

      if (versionsData == null) {
        next('route');
        return;
      }

      res.render('artifact', {
        title: versionsData[0].label,
        data: { auth: auth, versions: versionsData }
      });

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      let cacheKey = `ck_${req.params.account}_${req.params.group}_${req.params.artifact}_${req.params.version}`;
      let data = await cache.get(cacheKey, async () => {
        return {
          version: await sparql.dataid.getVersion(req.params.account, req.params.group,
            req.params.artifact, req.params.version),
          mods: await sparql.pages.getModsByVersion(req.params.account, req.params.group,
            req.params.artifact, req.params.version)
        };
      });

      data.auth = ServerUtils.getAuthInfoFromRequest(req);
      res.render('version', { title: data.version.label, data: data });
    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry cant find that!');
    }
  });
}
