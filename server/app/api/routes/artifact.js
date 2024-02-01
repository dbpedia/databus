const ServerUtils = require("../../common/utils/server-utils");
const DatabusUris = require("../../../../public/js/utils/databus-uris");
const Constants = require("../../common/constants");
const GstoreHelper = require('../../common/utils/gstore-helper');
const JsonldUtils = require("../../../../public/js/utils/jsonld-utils");
const DatabusLogger = require("../../common/databus-logger");
const UriUtils = require("../../common/utils/uri-utils");

const publishArtifact = require('../lib/publish-artifact');
const defaultContext = require('../../common/res/context.jsonld');
const getLinkedData = require("../../common/get-linked-data");
const jsonld = require('jsonld');
var cors = require('cors');

const sparql = require("../../common/queries/sparql");

module.exports = function (router, protector) {

  /**
  * Publishing of artifacts via PUT request
  */
  router.put('/:account/:group/:artifact', protector.protect(true), async function (req, res, next) {

    try {

      var artifactUri = UriUtils.createResourceUri([
        req.params.account,
        req.params.group,
        req.params.artifact
      ]);


      // Requesting a PUT on an uri outside of one's namespace is rejected
      if (req.params.account != req.databus.accountName) {
        res.status(403).send(MESSAGE_WRONG_NAMESPACE);
        return;
      }

      var logger = new DatabusLogger(req.query['log-level']);
      var graph = req.body;

      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
        logger.debug(null, `Context "${graph[DatabusUris.JSONLD_CONTEXT]}" replaced with cached resolved context`, defaultContext);
      }

      // Expand JSONLD!
      var expandedGraph = await jsonld.flatten(graph);

      // Publish artifacts
      var artifactGraph = JsonldUtils.getGraphById(expandedGraph, artifactUri);

      if (artifactGraph == null) {
        logger.error(null, `No graph ${artifactUri} found in the input.`, null);
        res.status(400).json(logger.getReport());
        return;
      }

      logger.debug(null, `Found graph ${artifactUri} in the input.`, artifactGraph);

      var code = await publishArtifact(req.params.account, artifactGraph, logger);
      res.status(code).json(logger.getReport());

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact', ServerUtils.NOT_HTML_ACCEPTED, cors(), async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.params.account}/${req.params.group}/${req.params.artifact}`;
    var template = require('../../common/queries/constructs/ld/construct-artifact.sparql');
    getLinkedData(req, res, next, resourceUri, template);
  });

  router.delete('/:account/:group/:artifact', protector.protect(true), async function (req, res, next) {

    var artifactUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group,
      req.params.artifact
    ]);

    // Check if the artifact exists
    var exists = await sparql.dataid.hasArtifact(artifactUri);

    if (!exists) {
      res.status(204).send(`The artifact  <${artifactUri}> does not exist.`);
      return;
    }

    // Allow deletion only if there are no artifacts (and thus no versions).
    var versions = await sparql.dataid.getVersionsByArtifact(artifactUri);

    if (versions.length > 0) {
      res.status(409).send(`Unable to delete non-empty artifact <${artifactUri}>.`);
      return;
    }

    // Delete from gstore and return result
    var gstorePath = `${req.params.group}/${req.params.artifact}/${Constants.DATABUS_FILE_ARTIFACT}`;
    var result = await GstoreHelper.delete(req.params.account, gstorePath);

    if (!result.isSuccess) {
      res.status(500).send(`Internal database error. Failed to delete artifact <${artifactUri}>.`);
      return;
    }

    res.status(204).send(`The artifact <${artifactUri}> has been deleted.`);
  });

}