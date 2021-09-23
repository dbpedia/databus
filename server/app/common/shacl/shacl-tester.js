// use https://www.npmjs.com/package/rdf-validate-shacl
const SHACLValidator = require('rdf-validate-shacl');
const factory = require('rdf-ext');
const ParserN3 = require('@rdfjs/parser-n3');
const ParserJsonld = require('@rdfjs/parser-jsonld');
const Readable = require('stream').Readable;
const fs = require('fs');

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



async function validateJsonld(rdf, shaclFile) {

  try {

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

  } catch (err) {
    console.log('Error during dataid shacl test ' + err);
    return { isSuccess: false, message: err };
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
  return await validateJsonld(rdf, 'group-shacl.ttl');
}

instance.validateDataidRDF = async function (rdf) {
  return await validateJsonld(rdf, 'dataid-shacl.ttl');
}

instance.validateCollectionRDF = async function (rdf) {
  return { isSuccess: true };
}

instance.validateWebIdRDF = async function (rdf) {
  return await validateJsonld(rdf, 'account-shacl.ttl');
}

// TODO
module.exports = instance;