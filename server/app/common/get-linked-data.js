const defaultContext = require('./context.json');
const rp = require('request-promise');
const request = require('request');
const jsonld = require('jsonld');
const exec = require('./execute-query');
const ServerUtils = require('./utils/server-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');

module.exports = async function getLinkedData(req, res, next, resourceUri, template) {

  // ASK if the requested resource exists

  var exists = await exec.executeAsk(`ASK { <${resourceUri}> ?p ?o }`);

  if (!exists) {
    next('route');
    return;
  }

  var query = ServerUtils.formatQuery(template, {
    RESOURCE_URI: resourceUri
  });

  var accept = req.get('Accept');
  var formatting = req.get('X-Jsonld-Formatting');

  console.log(formatting);

  if(accept == undefined) {
    accept = "application/ld+json";
  }

  // Do a POST request with the passed query
  var options = {
    method: 'POST',
    uri: `${process.env.DATABUS_DATABASE_URL}/sparql?timeout=10000`,
    body: `query=${encodeURIComponent(query)}`,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      "Accept": accept
    },
  };

  if (accept == "application/ld+json") {

    try {

      var result = JSON.parse(await rp(options));

      if(formatting == undefined || formatting == 'compacted' || formatting == 'compact') {
        // Single out jsonld in order to compact the result with the databus context
        var result = await jsonld.compact(result, defaultContext);

        if (process.env.DATABUS_CONTEXT_URL != undefined) {
          result[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
        }
      }
      else if(formatting == 'flatten') {
        var result = await jsonld.flatten(result);
      }

      res.set('Content-Type', 'application/ld+json');
      res.status(200).send(`${JSON.stringify(result, null, 3)}\n`);
    } catch (err) {
      res.status(500).send('Encountered a database error when trying to fetch the resource.');
    }
  } else {
    request(options).pipe(res);
  }
}