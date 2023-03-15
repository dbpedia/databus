const Constants = require('../../common/constants.js');
const ServerUtils = require('../../common/utils/server-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');

const publishDataId = require('../lib/publish-dataid');

var sparql = require('../../common/queries/sparql');
var request = require('request');
var GstoreHelper = require('../../common/utils/gstore-helper');
var defaultContext = require('../../common/context.json');
const UriUtils = require('../../common/utils/uri-utils.js');
const getLinkedData = require('../../common/get-linked-data.js');
const DatabusLogger = require('../../common/databus-logger.js');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const jsonld = require('jsonld');

module.exports = function (router, protector) {


  /**
   * Publishing via PUT request
   */
  router.put('/:account/:group/:artifact/:version', protector.protectAccount(true), async function (req, res, next) {
    try {

      var versionUri = UriUtils.createResourceUri([
        req.params.account,
        req.params.group,
        req.params.artifact,
        req.params.version
      ]);

      var logger = new DatabusLogger(req.query['log-level']);
      var graph = req.body;

      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
        logger.debug(null, `Context "${graph[DatabusUris.JSONLD_CONTEXT]}" replaced with cached resolved context`, defaultContext);
      }

      // Expand JSONLD!
      var expandedGraph = await jsonld.flatten(graph);
      var versionGraph = JsonldUtils.getGraphById(expandedGraph, versionUri);

      if (versionGraph == null) {
        res.status(400).send(`Graph with id ${versionUri} not found in input.`);
        return;
      }

      logger.debug(null, `Found graph ${versionUri} in input`, versionGraph);

      var verifyParts = req.query["fetch-file-properties"];

      if(verifyParts == undefined) {
        verifyParts = true;
      }
      
      var code = await publishDataId(req.params.account, expandedGraph, versionUri, verifyParts, logger);
      res.status(code).json(logger.getReport());

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group,
      req.params.artifact,
      req.params.version
    ]);

    var template = require('../../common/queries/constructs/ld/construct-version.sparql');
    getLinkedData(req, res, next, resourceUri, template);
  });

  router.get('/:account/:group/:artifact/:version/:file', async function (req, res, next) {

    // Return dataids?
    if (req.params.file == Constants.DATABUS_FILE_DATAID) {

      var repo = req.params.account;
      var path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${req.params.file}`;

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

  router.delete('/:account/:group/:artifact/:version', protector.protectAccount(true), async function (req, res, next) {

    var versionUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group,
      req.params.artifact,
      req.params.version
    ]);

    // Check if the artifact exists
    var exists = await sparql.dataid.hasVersion(
      req.params.account,
      req.params.group,
      req.params.artifact,
      req.params.version);

    if (!exists) {
      res.status(204).send(`The verison <${versionUri}> does not exist.`);
      return;
    }

    // Delete from gstore and return result
    var gstorePath = `${req.params.group}/${req.params.artifact}/${req.params.version}/${Constants.DATABUS_FILE_DATAID}`;
    var result = await GstoreHelper.delete(req.params.account, gstorePath);

    if (!result.isSuccess) {
      res.status(500).send(`Internal database error. Failed to delete version <${versionUri}>.`);
      return;
    }

    res.status(204).send(`The version <${versionUri}> has been deleted.`);
  });
}