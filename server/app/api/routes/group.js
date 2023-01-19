const ServerUtils = require("../../common/utils/server-utils");
const DatabusUris = require("../../../../public/js/utils/databus-uris");
const Constants = require("../../common/constants");
const publishGroup = require('../lib/publish-group');

var GstoreHelper = require('../../common/utils/gstore-helper');
var defaultContext = require('../../common/context.json');
var request = require('request');
const JsonldUtils = require("../../common/utils/jsonld-utils");
const DatabusLogger = require("../../common/databus-logger");
const jsonld = require('jsonld');
const rp = require('request-promise');
const getLinkedData = require("../../common/get-linked-data");


const MESSAGE_GROUP_PUBLISH_FINISHED = 'Publishing group finished with code ';

module.exports = function (router, protector) {

  /**
  * Publishing of groups via PUT request
  */
  router.put('/:account/:group', protector.protect(true), async function (req, res, next) {

    try {

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

      // Publish groups
      var groupGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_GROUP);
      logger.debug(null, `Found ${groupGraphs.length} group graphs.`, null);

      // console.log(groupGraphs);
      var expectedGroupUri = process.env.DATABUS_RESOURCE_BASE_URL + req.originalUrl;

      for (var groupGraph of groupGraphs) {
        if (groupGraph[DatabusUris.JSONLD_ID] != expectedGroupUri) {
          res.status(400).json(`Wrong group URI specified. Expected ${expectedGroupUri}`);
          return;
        }
      }

      var account = req.databus.accountName;

      for (var groupGraph of groupGraphs) {
        var resultCode = await publishGroup(account, groupGraph, logger);

        if (resultCode != 200) {
          res.status(resultCode).json(logger.getReport());
          return;
        }
      }

      res.status(200).json(logger.getReport());
      /*

      var graph = req.body;

      // Resolve the context if it is the default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      }

      // Call the publishing routine and log to a string
      var report = `Publishing Group.\n`;

      var groupResult = await publishGroup(account, graph, groupUri, function (message) {
        report += `> ${message}\n`;
      });

      // Return the result with the logging string
      res.set('Content-Type', 'text/plain');
      var returnCode = groupResult.code;

      if (returnCode < 200) {
        returnCode = 400;
      }

      report += `${MESSAGE_GROUP_PUBLISH_FINISHED}${returnCode}.\n`;
      res.status(returnCode).send(report);
      */

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

  router.delete('/:account/:group', protector.protect(true), async function (req, res, next) {

    // Requesting a DELETE on an uri outside of one's namespace is rejected
    if (req.params.account != req.databus.accountName) {
      res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
      return;
    }

    var path = `${req.params.group}/${Constants.DATABUS_FILE_GROUP}`;
    var resource = await GstoreHelper.read(req.params.account, path);

    if (resource == null) {
      res.status(204).send(`The group "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" does not exist.`);
      return;
    }

    var result = await GstoreHelper.delete(req.params.account, path);
    var message = '';

    if (result.isSuccess) {
      message = `The group "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" has been deleted.`
    } else {
      message = `Internal database error. Failed to delete the group "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}".`
    }

    res.status(result.isSuccess ? 200 : 500).send(message);
  });

}