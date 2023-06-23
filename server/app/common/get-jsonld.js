const defaultContext = require('./context.json');
const rp = require('request-promise');
const request = require('request');
const jsonld = require('jsonld');
const exec = require('./execute-query');
const ServerUtils = require('./utils/server-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const HttpStrings = require('./http-strings');


module.exports = async function getJsonLd(resourceUri, template, formatting) {

  try {

    var exists = await exec.executeAsk(`ASK { <${resourceUri}> ?p ?o }`);

    if (!exists) {
      return null;
    }

    var query = ServerUtils.formatQuery(template, {
      RESOURCE_URI: resourceUri
    });

    var headers = {};
    headers[HttpStrings.HEADER_CONTENT_TYPE] = HttpStrings.CONTENT_TYPE_FORM_URL_ENCODED;
    headers[HttpStrings.HEADER_ACCEPT] = HttpStrings.CONTENT_TYPE_JSONLD;

    var options = {
      method: HttpStrings.METHOD_POST,
      uri: `${process.env.DATABUS_DATABASE_URL}/sparql?timeout=10000`,
      body: `query=${encodeURIComponent(query)}`,
      headers: headers,
    };

    var result = JSON.parse(await rp(options));

    if (formatting == undefined || formatting == 'compacted' || formatting == 'compact') {
      // Single out jsonld in order to compact the result with the databus context
      var result = await jsonld.compact(result, defaultContext);
      if (process.env.DATABUS_CONTEXT_URL != undefined) {
        result[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      }
    }
    else if (formatting == 'flatten') {
      var result = await jsonld.flatten(result);
    }

    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
}