// TODO: Use JENA SHACL implementation instead! (SPARQL-SHACL needed)

const SHACLValidator = require('rdf-validate-shacl');
const factory = require('rdf-ext');
const ParserN3 = require('@rdfjs/parser-n3');
const ParserJsonld = require('@rdfjs/parser-jsonld');
const Readable = require('stream').Readable;
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require("path");
var jsonld = require('jsonld');
const JsonldUtils = require('../../../public/js/utils/jsonld-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const DatabusUtils = require('../../../public/js/utils/databus-utils');
const Constants = require('./constants');

var databaseUri = process.env.DATABUS_DATABASE_URL || Constants.DEFAULT_DATABASE_URL;


var instance = {}


// Runs a shacl validation on rdf in jsonld using the passed shacl file (ttl)
instance.validateJsonld = async function(rdf, shaclFile) {

  try {


    const formData = new FormData();
    formData.append('graph', JSON.stringify(rdf));
    formData.append('shacl', fs.createReadStream(path.resolve(__dirname, shaclFile)));

    const { data: resBody } = await axios.post(`${databaseUri}/shacl/validate`, formData, {
      headers: {
        ...formData.getHeaders(),
        Accept: 'application/ld+json',
      },
      responseType: 'text',
    });

    var expandedRes = await jsonld.flatten(JSON.parse(resBody));

    var validationReport = JsonldUtils.getTypedGraph(expandedRes, DatabusUris.SHACL_VALIDATION_REPORT);
    var conforms = validationReport[DatabusUris.SHACL_CONFORMS][0][DatabusUris.JSONLD_VALUE];
    var messages = [];

    var conforms = DatabusUtils.resemblesTrue(conforms);

    if(!conforms) {
      var validationResults = JsonldUtils.getTypedGraphs(expandedRes, DatabusUris.SHACL_VALIDATION_RESULT);
      for(var result of validationResults) {
        var message = result[DatabusUris.SHACL_RESULT_MESSAGE][0][DatabusUris.JSONLD_VALUE];
        messages.push(message);
      }
    }

    return { isSuccess: conforms, messages: messages, report: JSON.parse(resBody) };

  } catch (err) {

    if (err.response == undefined) {
      return { isSuccess: false, message: err };
    }

    return { isSuccess: false, message: err.response.data };
  }
}

instance.validateVersionInputRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './shacl/version-input.shacl');
}

instance.validateGroupRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './res/shacl/group.shacl');
}

instance.validateArtifactRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './res/shacl/artifact.shacl');
}

instance.validateVersionRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './res/shacl/version.shacl');
}

instance.validateCollectionRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './res/shacl/collection.shacl');
}

instance.validateWebIdRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './res/shacl/account.shacl');
}

module.exports = instance;