var http = require('http');
var request = require('request');

var cors = require('cors');
var defaultContext = require('../../../../model/generated/context.json');

const publishGroup = require('../lib/publish-group');
const publishDataId = require('../lib/publish-dataid');
const DatabusUris = require('../../../../public/js/utils/databus-uris');

const MESSAGE_GROUP_PUBLISH_FINISHED = 'Publishing group finished with code ';
const MESSAGE_DATAID_PUBLISH_FINISHED = 'Publishing DataId finished with code ';

module.exports = function (router, protector) {

  router.get('/sparql', cors(), function (req, res) {
    var url = `${process.env.DATABUS_DATABASE_URL}${req.originalUrl.replace('/system', '')}`;
    request(url).pipe(res);
  });

  router.post('/sparql', cors(), async function (req, res) {

    var sparqlEndpoint = `${process.env.DATABUS_DATABASE_URL}/sparql`;
    var query = req.body.query;
    var accept = req.headers['accept']

    if(accept == undefined) {
       accept = 'application/json';
    }

    var options = {
      method: 'POST',
      uri: sparqlEndpoint + '?timeout=10000',
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

      // Set return code to accepted
      res.set('Content-Type', 'text/plain');
      res.status(202);

      // Get the account namespace
      var account = req.databus.accountName;

      // Find graph
      var graph = req.body;
      var debug = req.query['debug'] == "true" ? true : false;

      
      // Replace context if graph uses default context
      if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      }

      res.write(`Publishing Group.\n`);

      var groupResult = await publishGroup(account, graph, null, function (message) {
        res.write(`> ${message}\n`);
      });

      if (groupResult != undefined) {
        res.write(`${MESSAGE_GROUP_PUBLISH_FINISHED}${groupResult.code}.\n`)
      }

      res.write('================================================\n');

      var verifyParts = req.query['verify-parts'] == "false" ? false : true;
    
      res.write(`Publishing DataId.\n`);


      var dataIdResult = await publishDataId(account, graph, verifyParts, function (message) {
        res.write(`> ${message}\n`);
      }, debug);

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