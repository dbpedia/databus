const ServerUtils = require("../../common/utils/server-utils");
const DatabusUris = require("../../../../public/js/utils/databus-uris");
const Constants = require("../../common/constants");
const GstoreHelper = require('../../common/utils/gstore-helper');
const JsonldUtils = require("../../../../public/js/utils/jsonld-utils");
const DatabusLogger = require("../../common/databus-logger");
const UriUtils = require("../../common/utils/uri-utils");
const jsonld = require('jsonld');
const getLinkedData = require("../../common/get-linked-data");
var cors = require('cors');

const sparql = require("../../common/queries/sparql");
const GroupWriter = require("../lib/group-writer");


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

      let expandedGraph = await jsonld.expand(graph);
      var groupGraph = JsonldUtils.getGraphById(expandedGraph, groupUri);

      if (groupGraph == null) {
        logger.error(null, `No graph ${groupUri} found in the input.`, null);
        res.status(400).json(logger.getReport());
        return;
      }

      try {
        var groupWriter = new GroupWriter(logger);
        await groupWriter.writeResource(req.databus, expandedGraph, groupUri);
      }
      catch (apiError) {
        logger.error(apiError.resource, apiError.message, apiError.body);
        res.status(apiError.statusCode).json(logger.getReport());
        return;
      }

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group', ServerUtils.NOT_HTML_ACCEPTED, cors(), async function (req, res, next) {

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
      res.status(404).send(`The group  <${groupUri}> does not exist.`);
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