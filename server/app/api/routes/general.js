var http = require('http');
var request = require('request');
var cors = require('cors');
var defaultContext = require('../../common/context.json');
const publishGroup = require('../lib/publish-group');
const publishDataId = require('../lib/publish-dataid');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const publishArtifact = require('../lib/publish-artifact');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
var jsonld = require('jsonld');
const DatabusLogger = require('../../common/databus-logger');

module.exports = function (router, protector, webdav) {

  router.get('/sparql', cors(), function (req, res) {
    var url = `${process.env.DATABUS_DATABASE_URL}${req.originalUrl.replace('/system', '')}`;
    request(url).pipe(res);
  });

  router.post('/sparql', cors(), async function (req, res) {

    var sparqlEndpoint = `${process.env.DATABUS_DATABASE_URL}/sparql`;
    var query = req.body.query;
    var accept = req.headers['accept']
    

    if (accept == undefined) {
      accept = 'application/json';
    }

    var options = {
      method: 'POST',
      uri: sparqlEndpoint,
      body: "query=" + encodeURIComponent(query),
      headers: {
        "Accept": accept,
        "Content-type": "application/x-www-form-urlencoded"
      },
    };

    request.post(options).pipe(res);
  });

  router.post('/api/publish', protector.protect(true), async function (req, res, next) {

    try {

      // Get the account namespace
      var account = req.databus.accountName;
      var verifyParts = req.query['fetch-file-properties'] == "false" ? false : true;
      var logger = new DatabusLogger(req.query['log-level']);
      var graph = req.body;

      console.log(graph)

      var processedResources = 0;

      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
        logger.debug(null, `Context "${graph[DatabusUris.JSONLD_CONTEXT]}" replaced with cached resolved context`, defaultContext);
      }

      // Expand JSONLD!
      var expandedGraph = await jsonld.flatten(graph);

      // Publish groups
      var groupGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_GROUP);
      logger.debug(null, `Found ${groupGraphs.length} group graphs.`, null);
      processedResources += groupGraphs.length;
      // console.log(groupGraphs);

      for (var groupGraph of groupGraphs) {
        var resultCode = await publishGroup(account, groupGraph, logger);

        if (resultCode != 200) {
          res.status(resultCode).json(logger.getReport());
          return;
        }
      }

      // Publish artifacts
      var artifactGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_ARTIFACT);
      logger.debug(null, `Found ${artifactGraphs.length} artifact graphs.`, null);
      processedResources += artifactGraphs.length;

      for (var artifactGraph of artifactGraphs) {
        var resultCode = await publishArtifact(account, artifactGraph, logger);

        if (resultCode != 200) {
          res.status(resultCode).json(logger.getReport());
          return;
        }
      }

      // Publish versions
      var datasetGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_VERSION);
      logger.debug(null, `Found ${datasetGraphs.length} version graphs.`, null);
      processedResources += datasetGraphs.length;

      for (var datasetGraph of datasetGraphs) {
        var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];
        var resultCode = await publishDataId(account, expandedGraph, datasetGraphUri, verifyParts, logger);

        if (resultCode != 200) {
          res.status(resultCode).json(logger.getReport());
          return;
        }
      }

      if(processedResources == 0) {
        logger.error(null, `No processable graphs found in the input.`, req.body);
        res.status(400).json(logger.getReport());
        return;
      }

      res.status(200).json(logger.getReport());

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });


  router.get('/api/search', cors(), function (req, res, next) {

    var queryString = '';
    var first = true;

    for (var param in req.query) {
      queryString += `${first ? '?' : '&'}${param}=${req.query[param]}`;
      first = false;
    }

    var search = `http://localhost:8082/api/search${queryString}`;

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
          console.log(err);
          res.status(404).send('Search Unavailable.');
        }
      });
    }).on("error", function (err) {
      console.log(err);
      res.status(404).send('Search Unavailable.');
    });
  });
}