var sparql = require('../../common/queries/sparql');
var request = require('request');

const DatabusCache = require('../../common/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');

module.exports = function (router, protector) {

  var cache = new DatabusCache(60);

  router.get('/:account', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {

    try {
      var auth = ServerUtils.getAuthInfoFromRequest(req);
      var accountData = await sparql.accounts.getAccount(req.params.account);

      console.log(accountData);
      if (accountData == null) {
        res.status(404).send('Sorry cant find that!');
        return;
      }

      res.render('account', {
        title: accountData == null ? 'Create Profile' : accountData.label,
        data: {
          auth: auth,
          username: req.params.account,
          profile: accountData,
        }
      });


    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry cant find that!');
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

  router.get('/:account/:group', ServerUtils.JSON_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = req.params.group;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}/group.jsonld`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
  });

  router.get('/:account/:group', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {
    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let groupData = await sparql.dataid.getGroup(req.params.account, req.params.group);

      if (groupData == null) {
        res.status(404).send("Sorry can't find that group!");
        return; AmQtweV7PuUY59F
      }

      let artifactData = await sparql.dataid.getArtifactsByGroup(req.params.account, req.params.group);

      res.render('group', {
        title: groupData.label,
        data: { auth: auth, group: groupData, artifacts: artifactData }
      });

    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry cant find that!');
    }
  });

  router.get('/:account/collections/:collection', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {
    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let collectionData = await sparql.collections.getCollection(req.params.account, req.params.collection);

      if (collectionData == null) {
        res.status(404).send('Unable to find the collection.');
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
      res.status(404).send('Unable to find the collection.');
    }
  });


  router.get('/:publisher/collections/:collection', ServerUtils.JSON_ACCEPTED, function (req, res, next) {

    sparql.collections.getCollection(req.params.publisher, req.params.collection).then(function (result) {
      if (result != null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Unable to find the collection.');
      }
    });
  });

  router.get('/:account/:group/:artifact', protector.checkSso(), async function (req, res, next) {
    try {
      let auth = ServerUtils.getAuthInfoFromRequest(req);
      let versionsData = await sparql.dataid.getVersionsByArtifact(req.params.account, req.params.group, req.params.artifact);

      if (versionsData == null) {
        res.status(404).send("Sorry can't find that Artifact!");
        return;
      }

      res.render('artifact', {
        title: versionsData[0].label,
        data: { auth: auth, versions: versionsData }
      });
    } catch (err) {

      console.log(err);
      res.status(404).send("Sorry can't find that!");
    }
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.JSON_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = `${req.params.group}/${req.params.artifact}/${req.params.version}`;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}/dataid.jsonld`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
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

      console.log(data);
      data.auth = ServerUtils.getAuthInfoFromRequest(req);

      res.render('version', { title: data.version.label, data: data });
    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry cant find that!');
    }
  });

  router.get('/:account/:group/:artifact/:version/:file', async function (req, res, next) {

    // Return dataids?
    if (req.params.file.startsWith('dataid.')) {

      var repo = req.params.account;
      var path = req.path;

      let options = {
        url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
        headers: {
          'Accept': 'application/ld+json'
        },
        json: true
      };

      console.log(`Piping to ${options.url}`);
      request(options).pipe(res);
      return;
    }

    try {
      var result = await sparql.dataid.getDownloadUrl(req.params.account, req.params.group,
        req.params.artifact, req.params.version, req.params.file);

      if (result == null) {
        res.status(404).send('Sorry can\'t find that!');
        return;
      }

      res.redirect(307, result.downloadUrl);
    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry can\'t find that! ');
    };
  });

}

/*
var dataRequests = [];
dataRequests.push({ key: constants.KEY_AUTH, promise: dataLoader.loadUserData(req) });
dataRequests.push({ key: constants.KEY_VERSION_DATA, promise: dataLoader.getVersionData(req.params.publisher, req.params.group, req.params.artifact, req.params.version) });
dataRequests.push({ key: constants.KEY_SERVICES, promise: dataLoader.getServicesByGroup(req.params.publisher, req.params.group) });
dataRequests.push({
   key: constants.KEY_ACTIONS, promise: dataLoader.getVersionActions(
      req.params.publisher,
      req.params.group,
      req.params.artifact,
      req.params.version)
});
dataRequests.push({
   key: constants.KEY_MODS, promise: dataLoader.getModsByVersion(
      req.params.publisher,
      req.params.group,
      req.params.artifact,
      req.params.version)
});
databusUtils.respondWithData(dataLoader, function (data) { return data.versionData.label; }, 'version', dataRequests, res);*/

