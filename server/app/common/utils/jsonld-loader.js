
const Constants = require('../constants');
const axios = require('axios');
const jsonld = require('jsonld');
const defaultContext  = require('../../common/res/context.jsonld');

class JsonldLoader {

  static DEFAULT_CONTEXT_URL;
    
  static initialize() {

    JsonldLoader.DEFAULT_CONTEXT_URL = `${process.env.DATABUS_RESOURCE_BASE_URL}${Constants.DATABUS_DEFAULT_CONTEXT_PATH}`

    // define a mapping of context URL => context doc
    const CONTEXTS = {}
    CONTEXTS[JsonldLoader.DEFAULT_CONTEXT_URL] = defaultContext;

    // change the default document loader
    const customLoader = async (url, options) => {

      if (url in CONTEXTS) {
        return {
          contextUrl: null,
          document: CONTEXTS[url],
          documentUrl: url
        };
      }

      try {
        // Use axios to fetch the document
        const response = await axios.get(url, {
          headers: { Accept: [ Constants.HTTP_CONTENT_TYPE_JSONLD, Constants.HTTP_CONTENT_TYPE_JSON ]},
          responseType: 'json',
          timeout: 5000,
        });

        return {
          contextUrl: null,
          document: response.data,
          documentUrl: url
        };
      } catch (error) {
        throw new Error(`Failed to load document from ${url}: ${error.message}`);
      }
    };

    jsonld.documentLoader = customLoader;
  }
}

module.exports = JsonldLoader;