const defaultContext = require('./res/context.jsonld');
const axios = require('axios');
const jsonld = require('jsonld');
const exec = require('./execute-query');
const ServerUtils = require('./utils/server-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const HttpStrings = require('./http-strings');

module.exports = async function getJsonLd(resourceUri, template, formatting) {

  try {

    // Check if resource exists
    const exists = await exec.executeAsk(`ASK { <${resourceUri}> ?p ?o }`);

    if (!exists) {
      return null;
    }

    // Format the query
    const query = ServerUtils.formatQuery(template, {
      RESOURCE_URI: resourceUri
    });

    const headers = {
      [HttpStrings.HEADER_CONTENT_TYPE]: HttpStrings.CONTENT_TYPE_FORM_URL_ENCODED,
      [HttpStrings.HEADER_ACCEPT]: HttpStrings.CONTENT_TYPE_JSONLD
    };

    // Prepare request options
    const options = {
      method: 'POST',
      url: `${process.env.DATABUS_DATABASE_URL}/sparql?timeout=10000`,
      headers: headers,
      data: `query=${encodeURIComponent(query)}`
    };

    // Send the request using axios
    const response = await axios(options);

    let result = response.data;

    // Format the result based on the requested formatting
    if (formatting === undefined || formatting === 'compacted' || formatting === 'compact') {
      // Compact the result with the Databus context
      result = await jsonld.compact(result, defaultContext);
      if (process.env.DATABUS_CONTEXT_URL !== undefined) {
        result[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      }
    } else if (formatting === 'flatten') {
      // Flatten the result
      result = await jsonld.flatten(result);
    }

    return result;

  } catch (err) {
    console.log(err);
    return null;
  }
};
