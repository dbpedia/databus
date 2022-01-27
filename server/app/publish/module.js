
const publishGroup = require('./publish-group');
const publishDataId = require('./publish-dataid');
const Constants = require('../common/constants');

const DatabusUris = require('../../../public/js/utils/databus-uris');

var defaultContext = require('../common/context.json');

const MESSAGE_GROUP_PUBLISH_FINISHED = 'Publishing group finished with code ';
const MESSAGE_DATAID_PUBLISH_FINISHED = 'Publishing DataId finished with code ';
const MESSAGE_WRONG_NAMESPACE = 'You cannot publish data in a foreign namespace.\n';
const MESSAGE_NOT_FOUND = 'Sorry can\'t find that!';

module.exports = function (router, protector) {

  router.post('/system/publish', protector.protect(), async function (req, res, next) {

    try {

      // Set return code to accepted
      res.status(202);

      // Get the account namespace
      var account = req.databus.accountName;

      // Find graph
      var graph = req.body;

      // Replace context if graph uses default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      }

      var groupResult = await publishGroup(account, graph, function (message) {
        res.write(message);
      });

      if (groupResult != undefined) {
        res.write(`${MESSAGE_GROUP_PUBLISH_FINISHED}${groupResult.code}.\n`)
      }

      res.write('================================================\n');

      var dataIdResult = await publishDataId(account, graph, function (message) {
        res.write(message);
      });

      if (dataIdResult != undefined) {
        res.write(`${MESSAGE_DATAID_PUBLISH_FINISHED}${dataIdResult.code}.\n`)
      }

      res.end();

    } catch (err) {
      console.log(err);
      res.status(500).end(err);
    }
  });

  /**
   * Publishing via PUT request
   */
  router.put('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {
    try {

      console.log('Upload request received at ' + req.originalUrl);

      // Requesting a PUT on an uri outside of one's namespace is rejected
      if (req.params.account != req.databus.accountName) {
        res.status(403).send(MESSAGE_WRONG_NAMESPACE);
        return;
      }

      var graph = req.body;

      // Resolve the context if it is the default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = DEFAULT_CONTEXT_STRING;
      }

      // Call the publishing routine and log to a string
      var progress = '';

      var dataIdResult = await publishDataId(req.databus.accountName, graph, function (message) {
        progress += message;
      });

      // Return the result with the logging string
      dataIdResult.message = message + dataIdResult.message;
      res.status(dataIdResult.code).send(dataIdResult.message);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });


  /**
   * Publishing of groups via PUT request
   */
  router.put('/:account/:group', protector.protect(), async function (req, res, next) {

    try {

      // Requesting a PUT on an uri outside of one's namespace is rejected
      if (req.params.account != req.databus.accountName) {
        res.status(403).send(MESSAGE_WRONG_NAMESPACE);
        return;
      }

      var account = req.databus.accountName;

      var graph = req.body;

      // Resolve the context if it is the default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = DEFAULT_CONTEXT_STRING;
      }

      // Call the publishing routine and log to a string
      var progress = '';

      var groupResult = await publishGroup(account, graph, function (message) {
        progress += message;
      });

      // Return the result with the logging string
      groupResult.message = message + groupResult.message;
      res.status(groupResult.code).send(groupResult.message);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });



}