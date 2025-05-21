var http = require('http');
var request = require('request');
const jsonld = require('jsonld');
var cors = require('cors');
const publishVersion = require('../lib/publish-version');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusLogger = require('../../common/databus-logger');
const AccountWriter = require('../lib/account-writer');
const GroupWriter = require('../lib/group-writer');
const ArtifactWriter = require('../lib/artifact-writer');
const CollectionWriter = require('../lib/collection-writer');
const ApiError = require('../../common/utils/api-error');
const { log } = require('console');
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

  /**
   * Tries to create a new user in the user database
   * @param {subect of the logged in user} sub 
   * @param {account name of the logged in user} accountName 
   * @returns 
   */
  async function createUser(sub, accountName) {

    var accountExists = await protector.hasUser(accountName);
    console.log(`Account does not exist yet!`);

    if(accountExists) {
      throw new ApiError(401, accountName, `Account <${accountName}> already exists.`, null);
    }

    try {
      
      console.log(`Adding to user database...`);
      await protector.addUser(sub, accountName, accountName);

      return {
        sub: sub,
        accountName: accountName
      };
    } catch(err) {
      console.log(err);
      throw new ApiError(500, accountName, `Failed to write to user database`, null);
    }
  }


  async function registerData(req, res, next) {

    try {

      // Get the account namespace
      var accounts = req.databus.accounts;

      var userData = {
        sub: req.databus.sub,
        accounts: req.databus.accounts
      };

      var verifyParts = null;
      
      if(req.query['fetch-file-properties'] == "false") {
        verifyParts = false;
      }

      if(req.query['fetch-file-properties'] == "true") {
        verifyParts = true;
      }

      var logger = new DatabusLogger(req.query['log-level']);
      var processedResources = 0;
      var expandedGraphs = await jsonld.flatten(req.body);
     
      try {
        // Publish accounts

        /*
        var accountGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_ACCOUNT);

        for (var accountGraph of accountGraphs) {
          processedResources++;
          var accountWriter = new AccountWriter(createUser, logger);
          await accountWriter.writeResource(userData, expandedGraphs, accountGraph[DatabusUris.JSONLD_ID]);
        }
        */

        // Publish collections
        var collectionGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_COLLECTION);
        logger.debug(null, `Found ${collectionGraphs.length} collection graphs.`, null);

        for (var collectionGraph of collectionGraphs) {
          processedResources++;
          var collectionWriter = new CollectionWriter(logger);
          await collectionWriter.writeResource(userData, expandedGraphs, collectionGraph[DatabusUris.JSONLD_ID]);
        }

        // Publish groups
        var groupGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_GROUP);
        logger.debug(null, `Found ${groupGraphs.length} group graphs.`, null);

        for (var collectionGraph of groupGraphs) {
          processedResources++;
          var groupWriter = new GroupWriter(logger);
          await groupWriter.writeResource(userData, expandedGraphs, collectionGraph[DatabusUris.JSONLD_ID]);
        }

        // Publish artifacts
        var artifactGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_ARTIFACT);
        logger.debug(null, `Found ${artifactGraphs.length} artifact graphs.`, null);

        for (var artifactGraph of artifactGraphs) {
          processedResources++;

          var artifactWriter = new ArtifactWriter(logger);
          await artifactWriter.writeResource(userData, expandedGraphs, artifactGraph[DatabusUris.JSONLD_ID]);
        }

        // Publish version

        
      }
      catch(apiError) {
        logger.error(apiError.resource, apiError.message, apiError.body);
        res.status(apiError.statusCode).json(logger.getReport());
        return;
      }

      // Publish versions
      var datasetGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_VERSION);
      logger.debug(null, `Found ${datasetGraphs.length} version graphs.`, null);
      processedResources += datasetGraphs.length;

      for (var datasetGraph of datasetGraphs) {
        var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];
        var resultCode = await publishVersion(accounts, expandedGraphs, datasetGraphUri, verifyParts, logger);

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