const ServerUtils = require("../../common/utils/server-utils");
const DatabusUris = require("../../../../public/js/utils/databus-uris");
const Constants = require("../../common/constants");
const GstoreHelper = require('../../common/utils/gstore-helper');
const JsonldUtils = require("../../../../public/js/utils/jsonld-utils");
const DatabusLogger = require("../../common/databus-logger");
const UriUtils = require("../../common/utils/uri-utils");

const publishGroup = require('../lib/publish-group');
const jsonld = require('jsonld');
const getLinkedData = require("../../common/get-linked-data");
const defaultContext = require('../../common/context.json');

const sparql = require("../../common/queries/sparql");


module.exports = function (router, protector) {

  /**
  * Publishing of groups via PUT request
  */
  router.put('/:account/:group', protector.protectAccount(true), async function (req, res, next) {

    try {

      var groupUri = UriUtils.createResourceUri([
        req.params.account,
        req.params.group
      ]);

      var logger = new DatabusLogger(req.query['log-level']);
      var graph = req.body;

      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
        logger.debug(null, `Context "${graph[DatabusUris.JSONLD_CONTEXT]}" replaced with cached resolved context`, defaultContext);
      }

      var expandedGraph = await jsonld.flatten(graph);

      // Publish groups
      var groupGraph = JsonldUtils.getGraphById(expandedGraph, groupUri);
    
      if (groupGraph == null) {
        logger.error(null, `No graph ${groupUri} found in the input.`, null);
        res.status(400).json(logger.getReport());
        return;
      }

      logger.debug(null, `Found graph ${groupUri} in the input.`, groupGraph);

      var code = await publishGroup(req.params.account, groupGraph, logger);
      res.status(code).json(logger.getReport());

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.params.account}/${req.params.group}`;
    var template = require('../../common/queries/constructs/ld/construct-group.sparql');
    getLinkedData(req, res, next, resourceUri, template);

  });

  router.delete('/:account/:group', protector.protectAccount(true), async function (req, res, next) {

    var groupUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group
    ]);

    // Check if the group exists
    var exists = await sparql.dataid.hasGroup(req.params.account, req.params.group);

    if (!exists) {
      res.status(204).send(`The group  <${groupUri}> does not exist.`);
      return;
    }

    // Allow deletion only if there are no artifacts (and thus no versions).
    var artifacts = await sparql.dataid.getArtifactsByGroup(req.params.account, req.params.group);

    if (artifacts.length > 0) {
      res.status(409).send(`Unable to delete non-empty group <${groupUri}>.`);
      return;
    }

    // Delete from gstore and return result
    var gstorePath = `${req.params.group}/${Constants.DATABUS_FILE_GROUP}`;
    var result = await GstoreHelper.delete(req.params.account, gstorePath);

    if (!result.isSuccess) {
      res.status(500).send(`Internal database error. Failed to delete the group <${groupUri}>.`);
      return;
    }

    res.status(204).send(`The group <${groupUri}> has been deleted.`);
  });

}