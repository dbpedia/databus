var http = require('http');
var request = require('request');
var cors = require('cors');
const publishGroup = require('../lib/publish-group');
const publishVersion = require('../lib/publish-version');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const publishArtifact = require('../lib/publish-artifact');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
var jsonld = require('jsonld');
const DatabusLogger = require('../../common/databus-logger');
var SparqlParser = require('sparqljs').Parser;

const ALLOWED_QUERY_TYPES = [
  "SELECT", "ASK", "DESCRIBE", "CONSTRUCT"
]

const MSG_NO_GRAPH_FOUND = `No processable graphs found in the input. Your input has to contain at least one graph of either type databus:Group, databus:Artifact or databus:Version.`

module.exports = function (router, protector, webdav) {

  router.get('/sparql', cors(), function (req, res, next) {

    var query = req.query.query;

    if(query == undefined || query == "") {
      next('route');
      return;
    }


    var url = `${process.env.DATABUS_DATABASE_URL}${req.originalUrl.replace('/system', '')}`;
    request(url).pipe(res);
  });

  router.post('/sparql', cors(), async function (req, res) {


    var query = req.body.query;

    var sparqlEndpoint = `${process.env.DATABUS_DATABASE_URL}/sparql`;
    var accept = req.headers['accept']

    try {
      var parser = new SparqlParser({ skipValidation: true });
      var parsedQuery = parser.parse(query);

      if(!ALLOWED_QUERY_TYPES.includes(parsedQuery.queryType)) {
        res.status(403).send("FORBIDDEN: SPARQL updates are disabled. Please use the API for write operations.");
        return;
      }

    }
    catch(err) {
      // Do nothing and let the virtuoso endpoint handle error reporting
    }
    

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

  router.post('/api/register', protector.protect(true), registerData);
  router.post('/api/publish', protector.protect(true), registerData);

  async function registerData(req, res, next) {

    try {

      // Get the account namespace
      var account = req.databus.accountName;
      var verifyParts = null;
      
      if(req.query['fetch-file-properties'] == "false") {
        verifyParts = false;
      }

      if(req.query['fetch-file-properties'] == "true") {
        verifyParts = true;
      }

      var logger = new DatabusLogger(req.query['log-level']);
      var graph = req.body;

      var processedResources = 0;

      // if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_CONTEXT_URL) {
      //  graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      //  logger.debug(null, `Context "${graph[DatabusUris.JSONLD_CONTEXT]}" replaced with cached resolved context`, defaultContext);
      //}

      // Expand JSONLD!
      var expandedGraph = await jsonld.flatten(graph);

      // Publish groups
      var groupGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATABUS_GROUP);
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
      var artifactGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATABUS_ARTIFACT);
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
      var datasetGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATABUS_VERSION);
      logger.debug(null, `Found ${datasetGraphs.length} version graphs.`, null);
      processedResources += datasetGraphs.length;

      for (var datasetGraph of datasetGraphs) {
        var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];
        var resultCode = await publishVersion(account, expandedGraph, datasetGraphUri, verifyParts, logger);

        if (resultCode != 200) {
          res.status(resultCode).json(logger.getReport());
          return;
        }
      }

      if(processedResources == 0) {
        logger.error(null, MSG_NO_GRAPH_FOUND, req.body);
        res.status(400).json(logger.getReport());
        return;
      }

      res.status(200).json(logger.getReport());

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  }

  router.get('/api/search', cors(), function (req, res, next) {

    var queryString = '';
    var first = true;

    for (var param in req.query) {
      queryString += `${first ? '?' : '&'}${param}=${req.query[param]}`;
      first = false;
    }

    var search = `${process.env.LOOKUP_BASE_URL}/api/search${queryString}`;

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