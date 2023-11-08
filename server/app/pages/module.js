var sparql = require('../common/queries/sparql');
var request = require('request');
var cors = require('cors');

var { setTimeout } = require('timers/promises');

const ServerUtils = require('../common/utils/server-utils.js');
const DatabusCache = require('../common/cache/databus-cache');
const LayeredCache = require('../common/cache/layered-cache')
const UriUtils = require('../common/utils/uri-utils');
const Constants = require('../common/constants');

module.exports = function (router, protector) {

  var cache = new LayeredCache(15, 6000);

  router.get('/', ServerUtils.HTML_ACCEPTED, protector.checkSso(), async function (req, res, next) {
    var data = {};
    data.auth = ServerUtils.getAuthInfoFromRequest(req);
    res.render('index', { title: 'Databus', data: data });
  });

  router.get('/app/index/activity', async function (req, res, next) {
    try {
      var cacheKey = `ck_global_activity`;
      var activity = await cache.get(cacheKey, () => sparql.pages.getGlobalActivityChartData());
      res.status(200).send(activity);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/index/ranking', async function (req, res, next) {
    try {
      var cacheKey = `ck_global_ranking`;
      var activity = await cache.get(cacheKey, () => sparql.pages.getPublishRankingData());
      res.status(200).send(activity);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.get('/app/index/recent', async function (req, res, next) {
    try {
      var cacheKey = `ck_global_recent`;
      var activity = await cache.get(cacheKey, () => sparql.pages.getRecentUploadsData());
      res.status(200).send(activity);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  // Pages login and logout
  router.get(Constants.DATABUS_OIDC_LOGIN_ROUTE, protector.protect(), function (req, res, next) {
    var redirectUrl = decodeURIComponent(req.query.redirectUrl);
    res.redirect(redirectUrl);
  });

  /*
    // Pages login and logout
    router.get('/page-login', protector.protect(), function (req, res, next) {
  
      var redirectUrl = decodeURIComponent(req.query.redirectUrl);
      res.redirect(redirectUrl);
    });*/

  router.get(Constants.DATABUS_OIDC_LOGOUT_ROUTE, function (req, res, next) {

    if (req.oidc.isAuthenticated()) {
      var requestUri = ServerUtils.getRequestUri(req);

      res.oidc.logout({
        returnTo: `${requestUri}${Constants.DATABUS_OIDC_LOGOUT_ROUTE}?redirectUrl=${req.query.redirectUrl}`
      });
    } else {
      res.redirect(decodeURIComponent(req.query.redirectUrl));
    }
  });

  

  router.get('/system/documentation/', protector.checkSso(), function (req, res, next) {


    var docuMd = require('./documentation.md');
    var accountShacl = require('../common/shacl/account-shacl.ttl');
    var groupShacl = require('../common/shacl/group-shacl.ttl');
    var dataidShacl = require('../common/shacl/dataid-shacl.ttl');
    var structureHtml = require('./documentation-structure.html');

    let options = {
      SHACL_SHAPE_ACCOUNT: accountShacl,
      SHACL_SHAPE_GROUP: groupShacl,
      SHACL_SHAPE_DATAID: dataidShacl,
      HTML_STRUCTURE: structureHtml,
    };

    for (var option in options) {
      var re = new RegExp('%' + option + '%', "g");
      docuMd = docuMd.replace(re, options[option]);
    }

    var uriReg = new RegExp('https://databus.example.org', "g");
    docuMd = docuMd.replace(uriReg, process.env.DATABUS_RESOURCE_BASE_URL);

    var auth = ServerUtils.getAuthInfoFromRequest(req);
    res.render('documentation', { title: 'Documentation', data: { auth: auth, content: docuMd } });
  });

  /* GET imprint page */
  router.get('/imprint', protector.checkSso(), function (req, res, next) {
    var auth = ServerUtils.getAuthInfoFromRequest(req);
    res.render('imprint', { title: 'Imprint', data: { auth: auth } });
  });

  /* GET about page */
  router.get('/about', protector.checkSso(), function (req, res, next) {
    var auth = ServerUtils.getAuthInfoFromRequest(req);
    res.render('about', { title: 'About', data: { auth: auth } });
  });


  var facetsCache = new DatabusCache(15, 6000);

  /**
   * Load facets for a given resource (group, artifact or version[to be implemented])
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  router.get('/app/utils/facets', async function (req, res, next) {

    try {

      var uri = req.query.uri;

      if (uri.endsWith("/")) {
        uri = uri.substr(0, uri.length - 1);
      }

      if (req.query.type == 'group') {
        var facets = await facetsCache.get(uri, async () => await sparql.pages.getGroupFacets(uri));
        res.status(200).send(facets);
        return;
      }

      if (req.query.type == 'artifact') {
        var facets = await facetsCache.get(uri, async () => await sparql.pages.getArtifactFacets(uri));
        res.status(200).send(facets);
        return;
      }

      if (req.query.type == 'version') {
        var facets = await facetsCache.get(uri, async () => await sparql.pages.getVersionFacets(uri));
        res.status(200).send(facets);
        return;
      }

      res.status(400).send('No resource type specified.');

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });


  require('./modules/account-page')(router, protector);
  require('./modules/collection-editor')(router, protector);
  require('./modules/sparql-editor')(router, protector);
  require('./modules/publish-wizard')(router, protector);
  require('./modules/resource-pages')(router, protector);

}
