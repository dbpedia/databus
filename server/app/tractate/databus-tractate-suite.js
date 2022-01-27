const rdfParser = require("rdf-parse").default;
const fs = require('fs');
var rp = require('request-promise');
var streamify = require('streamify-string');
const NodeRSA = require('node-rsa');
var JsonldUtils = require('../common/utils/jsonld-utils');
var jsonld = require('jsonld');
const autocompleter = require('../common/dataid-autocomplete');
const DatabusUris = require('../../../public/js/utils/databus-uris');


var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL || Constants.DEFAULT_DATABUS_RESOURCE_BASE_URL;

var tractateConfig = {
  header: 'Databus Tractate Version 1.0',
  publisherProperty: 'http://purl.org/dc/terms/publisher',
  versionProperty: 'http://dataid.dbpedia.org/ns/core#version',
  licenseProperty: 'http://purl.org/dc/terms/license',
  distributionProperty: 'http://www.w3.org/ns/dcat#distribution',
  sha256sumProperty: 'http://dataid.dbpedia.org/ns/core#sha256sum',
  proofProperty: 'https://w3id.org/security#proof',
  signatureProperty: 'https://w3id.org/security#signature'
}

// Signature (and tractate?) generation
var signer = {};

signer.init = function () {
  if (signer.privateKey != undefined) {
    return;
  }

  var privateKeyFile = __dirname + '/../../keypair/private-key.pem';
  var encodedPrivateKeyString = fs.readFileSync(privateKeyFile, "utf8");

  signer.privateKey = new NodeRSA(encodedPrivateKeyString, 'pkcs8');
}

signer.expandAndCanonicalize = async function(graph) {
  var expandedGraph = await jsonld.flatten(await jsonld.expand(graph));
  autocompleter.autocomplete(expandedGraph);
  return signer.canonicalize(expandedGraph);
}


signer.canonicalize = function (expandedGraph) {

  var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);

  var tractate = '';
  tractate += `${tractateConfig.header}\n`;
  tractate += `${JsonldUtils.getFirstObjectUri(datasetGraph, tractateConfig.publisherProperty)}\n`;
  tractate += `${JsonldUtils.getFirstObjectUri(datasetGraph, tractateConfig.versionProperty)}\n`;
  tractate += `${JsonldUtils.getFirstObjectUri(datasetGraph, tractateConfig.licenseProperty)}\n`;

  var shasums = [];

  var distributionGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_PART);

  for (var d in distributionGraphs) {
    var distributionGraph = distributionGraphs[d];
    var shasum = JsonldUtils.getFirstObject(distributionGraph, tractateConfig.sha256sumProperty);
    shasums.push(shasum['@value']);
  }

  shasums.sort();

  for (var s in shasums) {
    tractate += `${shasums[s]}\n`;
  }

  return tractate;
}

signer.createProof = function (datasetGraph) {
  
  return {
    '@type': [DatabusUris.DATABUS_TRACTATE_V1],
    'https://w3id.org/security#signature': [{
      "@type": "http://www.w3.org/2001/XMLSchema#string",
      "@value": signer.sign(signer.canonicalize(datasetGraph))
    }]
  };
}

function parseRdfSync(contentType, data) {
  var buffer = streamify(data);
  var quads = [];
  return new Promise(function (resolve, reject) {
    rdfParser.parse(buffer, { contentType: contentType })
      .on('data', (quad) => quads.push(quad))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(quads));
  });
}

function getObjectValues(quads, subject, predicate) {

  console.log(`Getting object values for <${subject}> <${predicate}> ?o...`);
  var values = [];
  var resultQuads = quads.filter(quad => quad.subject.value == subject && quad.predicate.value == predicate);
  for (var r in resultQuads) {
    values.push(resultQuads[r].object.value);
  }

  return values;
}

signer.validate = async function (canonicalized, proof) {

  try {
    var signature = proof[DatabusUris.SEC_SIGNATURE][0][DatabusUris.JSONLD_VALUE];
    var tractateLines = canonicalized.split('\n');
    var publisherUri = tractateLines[1];
    var fetchUri = publisherUri;

    // TODO: remove this in production
    if (fetchUri.startsWith(baseUrl)) {
      fetchUri = fetchUri.replace(`${baseUrl}`, 'http://localhost:3000');
    }

    // Do a POST request with the passed query
    var options = {
      method: 'GET',
      uri: fetchUri,
      transform: function (body, response, resolveWithFullResponse) {
        return { 'headers': response.headers, 'data': body };
      }
    };  

    console.log(`Fetching WebId document from ${publisherUri}...`);
    // Await the response
    var response = await rp(options);
    var contentType = response.headers['content-type'].split(' ')[0].split(';')[0];


    if (contentType.startsWith("text/plain")) {
      console.log('Content type is text/plain. Defaulting to text/turtle..');
      contentType = 'text/turtle';
    }

    if(contentType.startsWith('application/json')) {
      console.log('Content type is application/json. Changing to application/ld+json..');
      contentType = 'application/ld+json';
    }

    console.log(`WebId content type ${contentType} detected. Parsing...`);
    var quads = await parseRdfSync(contentType, response.data);
    var keyNodes = getObjectValues(quads, publisherUri, 'http://www.w3.org/ns/auth/cert#key');

    for (var k in keyNodes) {

      var keyNode = keyNodes[k];
      var modulus = getObjectValues(quads, keyNode, 'http://www.w3.org/ns/auth/cert#modulus');
      var exponent = getObjectValues(quads, keyNode, 'http://www.w3.org/ns/auth/cert#exponent');

      if (modulus.length != 1 || exponent.length != 1) {
        continue;
      }

      // Gotta love javascript madness
      modulus = modulus[0];
      exponent = exponent[0];

      console.log(`RSA key found. Creating key with\n ${modulus} / ${exponent}\n`);

      var key = new NodeRSA();
      key.importKey({
        n: Buffer.from(modulus, 'hex'),
        e: parseInt(exponent)
      }, 'components-public');

      console.log(`Verifying Signature:\n\n ${signature} \n\nagainst: \n\n${canonicalized}`);
      if (key.verify(Buffer.from(canonicalized), Buffer.from(signature, 'base64'))) {
        console.log(`Verification successful.`);
        return true;
      }

    }

    console.log('Failed to verify.');
    return false;
  } catch(err) {
    console.log('Failed to verify:' + err);
    return false;
  }
}

signer.sign = function (canonicalized) {
  signer.init();
  var data = Buffer.from(canonicalized);
  console.log(`Signing with internal private key.`);

  var sign = signer.privateKey.sign(data);
  var signature = sign.toString('base64');

  return signature;
};





module.exports = signer;