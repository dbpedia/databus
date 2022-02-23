const ServerUtils = require("../../common/utils/server-utils");
const DatabusUris = require("../../../../public/js/utils/databus-uris");
const Constants = require("../../common/constants");
const publishGroup = require('../lib/publish-group');

var GstoreHelper = require('../../common/gstore-helper');
var defaultContext = require('../../../../model/generated/context.json');
var request = require('request');

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

      var account = req.databus.accountName;
      var groupUri = process.env.DATABUS_RESOURCE_BASE_URL + req.originalUrl;

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

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    if(req.params.account.length < 4) {
      next('route');
      return;
    }
    
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