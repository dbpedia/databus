var sparql = require('../../common/queries/sparql');
var request = require('request');

const DatabusCache = require('../../common/cache/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');
const Constants = require('../../common/constants');
const UriUtils = require('../../common/utils/uri-utils');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const { dataid } = require('../../common/queries/sparql');
const getJsonLd = require('../../common/get-jsonld');
const accountQueryTemplate = require("../../common/queries/constructs/ld/construct-account.sparql");
const groupQueryTemplate = require("../../common/queries/constructs/ld/construct-group.sparql");
const artifactQueryTemplate = require("../../common/queries/constructs/ld/construct-artifact.sparql");
const collectionQueryTemplate = require("../../common/queries/constructs/ld/construct-collection.sparql");
const versionQueryTemplate = require("../../common/queries/constructs/ld/construct-version.sparql");

const AppJsonFormatter = require('../../../../public/js/utils/app-json-formatter');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');

module.exports = function (router, protector) {

  var cache = new DatabusCache(10);

  router.get('/:account', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var profileUri = `${UriUtils.createResourceUri([req.params.account])}${DatabusConstants.WEBID_DOCUMENT}`;

      var accountJsonLd = await getJsonLd(profileUri, accountQueryTemplate, 'flatten');

      if (accountJsonLd == null) {
        next('route');
        return;
      }

      var accountData = AppJsonFormatter.formatAccountData(accountJsonLd);

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

  router.get('/app/group/get-artifacts', async function (req, res, next) {
    try {
      var splits = UriUtils.splitResourceUri(req.query.uri);
      var accountName = splits[0];
      var groupName = splits[1];

      let cacheKey = `cache_key_artifacts__${accountName}_${groupName}`;

      let artifactData = await cache.get(cacheKey, async () => {
        return await sparql.dataid.getArtifactsByGroup(accountName, groupName);
      });

      res.status(200).send(artifactData);
    } catch (err) {
      res.status(400).send("Bad query");
    }
  });


  router.get('/:account/:group', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var groupUri = `${UriUtils.createResourceUri([req.params.account, req.params.group])}`;

      var groupJsonLd = await getJsonLd(groupUri, groupQueryTemplate, 'flatten');

      if (groupJsonLd == null) {
        next('route');
        return;
      }

      var groupData = AppJsonFormatter.formatGroupData(groupJsonLd);

      res.render('group', {
        title: groupData.title,
        data: {
          auth: auth,
          group: groupData
        }
      });


    } catch (err) {
      console.log(err);
      next('route');
    }

  });

  router.get('/:account/collections/:collection', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var collectionUri = UriUtils.createResourceUri([req.params.account, 'collections', req.params.collection]);
      var collectionJsonLd = await getJsonLd(collectionUri, collectionQueryTemplate, 'flatten');

      if (collectionJsonLd == null) {
        next('route');
        return;
      }

      var collectionData = AppJsonFormatter.formatCollectionData(collectionJsonLd);

      res.render('collection', {
        title: collectionData.title,
        data: { collection: collectionData, auth: auth }
      });

    } catch (err) {
      console.log(err);
      next('route');
    }
    /*

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
    */
  });

  router.get('/:account/:group/:artifact', protector.checkSso(), async function (req, res, next) {

    if (req.params.group == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      next('route');
      return;
    }

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var artifactUri = `${UriUtils.createResourceUri([req.params.account, req.params.group, req.params.artifact])}`;
      var artifactJsonLd = await getJsonLd(artifactUri, artifactQueryTemplate, 'flatten');

      if (artifactJsonLd == null) {
        next('route');
        return;
      }

      var artifactData = AppJsonFormatter.formatArtifactData(artifactJsonLd);
      var versions = await sparql.dataid.getVersionsByArtifact(artifactUri);

      res.render('artifact', {
        title: artifactData.title != undefined ? artifactData.title : artifactData.name,
        data: {
          auth: auth,
          artifact: artifactData,
          versions: versions
        }
      });


    } catch (err) {
      console.log(err);
      next('route');
    }

    /*

    try {

      let cacheKey = `ck_${req.params.account}_${req.params.group}_${req.params.artifact}`;
      let data = await cache.get(cacheKey, async () => {
        return {
          versions: await sparql.dataid.getVersionsByArtifact(req.params.account, req.params.group,
            req.params.artifact),
          artifact: await sparql.dataid.getArtifact(req.params.account, req.params.group, req.params.artifact)
        };
      });

      if (data.artifact == null) {
        next('route');
        return;
      }

      data.auth = ServerUtils.getAuthInfoFromRequest(req);

      res.render('artifact', {
        title: data.artifact.title,
        data: data
      });

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }*/
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {


      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var versionUri = UriUtils.createResourceUri([req.params.account, req.params.group,
      req.params.artifact, req.params.version]);

      var versionGraphs = await cache.get(versionUri, async () => {
        return await getJsonLd(versionUri, versionQueryTemplate, 'flatten')
      });

      if (versionGraphs == null) {
        next('route');
        return;
      }

      var versionGraph = JsonldUtils.getTypedGraph(versionGraphs, DatabusUris.DATABUS_VERSION);
      var versionTitle = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_TITLE);

      res.render('version', {
        title: versionTitle,
        data: {
          auth: auth,
          graph: versionGraph
        }
      });

    } catch (err) {
      console.log(err);
      next('route');
    }

    /*

    // Only deliver the version graph
    var versionGraph = JsonldUtils.getTypedGraph(data.version, DatabusUris.DATABUS_VERSION);
    data.version = [versionGraph];

    try {
      data.licenseData = await licenseCache.get('dalicc', async () => {
        return JSON.parse(await rp.get('https://api.dalicc.net/licenselibrary/list?limit=10000'));
      });
    } catch(err) {
      data.licenseData = null;
    }

    if (data.version == null) {
      next('route');
      return;
    }

    data.auth = ServerUtils.getAuthInfoFromRequest(req);
    res.render('version', { title: data.version.title, data: data });
  } catch (err) {
    console.log(err);
    res.status(404).send('Sorry cant find that!');
  } */
  });
}
