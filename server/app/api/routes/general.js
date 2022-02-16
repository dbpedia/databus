var http = require('http');
var cors = require('cors');
var defaultContext = require('../../../../model/generated/context.json');

const publishGroup = require('../lib/publish-group');
const publishDataId = require('../lib/publish-dataid');
const DatabusUris = require('../../../../public/js/utils/databus-uris');

const MESSAGE_GROUP_PUBLISH_FINISHED = 'Publishing group finished with code ';
const MESSAGE_DATAID_PUBLISH_FINISHED = 'Publishing DataId finished with code ';

module.exports = function (router, protector) {

  router.post('/api/publish', protector.protect(true), async function (req, res, next) {

    try {

      // Set return code to accepted
      res.set('Content-Type', 'text/plain');
      res.status(202);

      // Get the account namespace
      var account = req.databus.accountName;

      // Find graph
      var graph = req.body;

      
      // Replace context if graph uses default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      }

      var groupResult = await publishGroup(account, graph, null, function (message) {
        res.write(message);
      });

      if (groupResult != undefined) {
        res.write(`${MESSAGE_GROUP_PUBLISH_FINISHED}${groupResult.code}.\n`)
      }

      res.write('================================================\n');

      verifyParts = req.query['verify-parts'] == "false" ? false : true;

      var dataIdResult = await publishDataId(account, graph, verifyParts, function (message) {
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


  router.get('/api/search', cors(), function (req, res, next) {

    var queryString = '';
    var first = true;

    for(var param in req.query) {
      queryString += `${first ? '?' : '&'}${param}=${req.query[param]}`;
      first = false;
    }

    var search = `http://localhost:8080/lookup-application/api/search${queryString}`;

    http.get(search, function (response) {
      response.setEncoding('utf8');

      var resBody = '';

      response.on('data', function (chunk) {
        resBody += chunk
      });

      response.on('end', function () {

        try {
          var resBodyJson = JSON.parse(resBody);
          resBodyJson.query = req.query.query;
          res.status(200).send(resBodyJson);
        } catch (err) {
          res.status(404).send('Search Unavailable.');
        }
      });
    }).on("error", function (err) {
      res.status(404).send('Search Unavailable.');
    });
  });
}