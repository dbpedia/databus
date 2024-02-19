const request = require('request');
const exec = require('./execute-query');
const ServerUtils = require('./utils/server-utils');
const HttpStrings = require('./http-strings');
const getJsonld = require('./get-jsonld');


module.exports = async function getLinkedData(req, res, next, resourceUri, template) {


  // ASK if the requested resource exists
  var exists = await exec.executeAsk(`ASK { <${resourceUri}> ?p ?o }`);

  if (!exists) {
    next('route');
    return;
  }

  // Get request headers
  var accept = req.get(HttpStrings.HEADER_ACCEPT);
  var formatting = req.get(HttpStrings.HEADER_JSONLD_FORMATTING);

  // Default to jsonld
  if (accept == undefined) {
    accept = HttpStrings.CONTENT_TYPE_JSONLD;
  }

  let firstAccept = accept;

  let indexOfComma = accept.indexOf(",");

  if(indexOfComma >= 0) {
    firstAccept = accept.substring(0, indexOfComma);
  }

  console.log(firstAccept);
  console.log(HttpStrings.CONTENT_TYPE_JSONLD);


  if (firstAccept == HttpStrings.CONTENT_TYPE_JSONLD) {
    // Handle JSONLD separately
    var jsonld = await getJsonld(resourceUri, template, formatting);

    if (jsonld != null) {
      res.set(HttpStrings.HEADER_CONTENT_TYPE, HttpStrings.CONTENT_TYPE_JSONLD);
      res.status(200).send(`${JSON.stringify(jsonld, null, 3)}\n`);
      return;
    }
  }

  // Format the query
  var query = ServerUtils.formatQuery(template, {
    RESOURCE_URI: resourceUri
  });

  // Prepare OPTIONS for database request
  var headers = {};
  headers[HttpStrings.HEADER_CONTENT_TYPE] = HttpStrings.CONTENT_TYPE_FORM_URL_ENCODED;
  headers[HttpStrings.HEADER_ACCEPT] = accept;

  var options = {
    method: HttpStrings.METHOD_POST,
    uri: `${process.env.DATABUS_DATABASE_URL}/sparql?timeout=10000`,
    body: `query=${encodeURIComponent(query)}`,
    headers: headers,
  };

  // Pipe the request
  request(options).pipe(res);
  return;
}