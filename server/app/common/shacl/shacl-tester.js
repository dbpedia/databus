// TODO: Use JENA SHACL implementation instead! (SPARQL-SHACL needed)

const SHACLValidator = require('rdf-validate-shacl');
const factory = require('rdf-ext');
const ParserN3 = require('@rdfjs/parser-n3');
const ParserJsonld = require('@rdfjs/parser-jsonld');
const Readable = require('stream').Readable;
const fs = require('fs');
var rp = require('request-promise');
const path = require("path");
var jsonld = require('jsonld');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');

var databaseUri = process.env.DATABUS_DATABASE_URL || Constants.DEFAULT_DATABASE_URL;


var instance = {}

const SHACL_DEFAULT_ERROR_MESSAGE = "The supplied RDF data does not conform to the required SHACL shapes."

async function loadDatasetN3(filePath) {
  var stream = fs.createReadStream(filePath);
  var parser = new ParserN3({ factory });
  return factory.dataset().import(parser.import(stream));
}

async function loadDatasetJsonld(jsonld) {

  var stream = new Readable({
    read: () => {
      stream.push(JSON.stringify(jsonld))
      stream.push(null)
    }
  });

  const parser = new ParserJsonld();
  return factory.dataset().import(parser.import(stream))
}


async function loadDatasetN3Object(n3) {

  var stream = new Readable({
    read: () => {
      stream.push(n3);
      stream.push(null);
    }
  });

  const parser = new ParserN3({ factory });
  return factory.dataset().import(parser.import(stream))
}


// Runs a shacl validation on rdf in jsonld using the passed shacl file (ttl)
instance.validateJsonld = async function(rdf, shaclFile) {

  try {

    var options = {
      formData: {
        graph: JSON.stringify(rdf),
        shacl: fs.createReadStream(path.resolve(__dirname, shaclFile))
      },
      method: 'POST',
      uri: `${databaseUri}/shacl/validate`,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/ld+json'
      }
    };

    var res = await rp(options);

    var expandedRes = await jsonld.flatten(JSON.parse(res));

    var validationReport = JsonldUtils.getTypedGraph(expandedRes, DatabusUris.SHACL_VALIDATION_REPORT);
    var conforms = validationReport[DatabusUris.SHACL_CONFORMS][0][DatabusUris.JSONLD_VALUE];
    var messages = [];

    if(!conforms) {

      var validationResults = JsonldUtils.getTypedGraphs(expandedRes, DatabusUris.SHACL_VALIDATION_RESULT);
    
      for(var result of validationResults) {
        var message = result[DatabusUris.SHACL_RESULT_MESSAGE][0][DatabusUris.JSONLD_VALUE];
        messages.push(message);
      }
    }

    return { isSuccess: conforms, messages: messages, report: JSON.parse(res) };

    /*
    if (instance.validators == null) {
      instance.validators = {};
    }

    if (instance.validators[shaclFile] == undefined) {
      var shapes = await loadDatasetN3(__dirname + '/' + shaclFile);
      instance.validators[shaclFile] = new SHACLValidator(shapes);
    }

    var data = await loadDatasetJsonld(rdf);
    var report = await instance.validators[shaclFile].validate(data);

    var messages = [];

    if (!report.conforms) {

      for (var result of report.results) {
        for(var message of result.message) {
          if (message != undefined && message.value.length > 0) {
            messages.push(message.value);
          }
        }
      }

      if(messages.length == 0) {
        messages.push(SHACL_DEFAULT_ERROR_MESSAGE);
      }

      return { isSuccess: false, messages: messages };
    }

    return { isSuccess: true };
*/
  } catch (err) {

    console.log(err);
    if (err.response == undefined) {
      return { isSuccess: false, message: err };
    }

    return { isSuccess: false, message: err.response.body };
  }
}

async function validateN3(rdf, shaclFile) {

  try {

    if (instance.validators == null) {
      instance.validators = {};
    }

    if (instance.validators[shaclFile] == undefined) {
      var shapes = await loadDatasetN3(__dirname + '/' + shaclFile);
      instance.validators[shaclFile] = new SHACLValidator(shapes);
    }

    var data = await loadDatasetN3Object(rdf);
    var report = await instance.validators[shaclFile].validate(data);

    if (!report.conforms) {
      //console.log(report.results[0].message);
      return { isSuccess: false, message: report.results };
    }

    return { isSuccess: true };

  } catch (err) {
    console.log('Error during dataid shacl test ' + err);
    return { isSuccess: false, message: err };
  }
}

instance.validateGroupRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './../../../../model/generated/shacl/group.shacl');
}

instance.validateArtifactRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './../../../../model/generated/shacl/artifact.shacl');
}

instance.validateDataidRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, './../../../../model/generated/shacl/dataid.shacl');
}

instance.validateCollectionRDF = async function (rdf) {
  return { isSuccess: true };
}

instance.validateWebIdRDF = async function (rdf) {
  return await instance.validateJsonld(rdf, 'account-shacl.ttl');
}

module.exports = instance;