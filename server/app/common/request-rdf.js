const rdfParser = require("rdf-parse").default;
var rp = require('request-promise');
var streamify = require('streamify-string');

function parseRdfSync(contentType, data) {
  var buffer = streamify(data);
  var quads = [];
  return new Promise(function (resolve, reject) {
    rdfParser.parse(buffer, { contentType: contentType })
      .on('data', (quad) => { quads.push(quad); })
      .on('error', (error) => reject(error))
      .on('end', () => resolve(quads));
  });
}

var requestRDF = {};

requestRDF.requestQuads = async function(uri) {

  // Do a POST request with the passed query
  var options = {
    method: 'GET',
    uri: uri,
    headers: {
      "Accept": 'text/turtle, application/ld+json, text/plain, application/rdf+xml, application/x-turtle'
    },
    transform: function (body, response, resolveWithFullResponse) {
      return { 'headers': response.headers, 'data': body };
    }
  };

  // Await the response
  var response = await rp(options);
  var contentType = response.headers['content-type'].split(' ')[0].split(';')[0];

  if (contentType.startsWith("text/plain")) {
    contentType = 'text/turtle';
  }

  if(contentType.startsWith('application/json')) {
    contentType = 'application/ld+json';
  }

  console.log(`Content type ${contentType} detected. Parsing...`);
  var quads = await parseRdfSync(contentType, response.data);

  return quads;
}

requestRDF.requestN3 = async function(uri) {
  var quads = await requestRDF.requestQuads(uri);
  var triples = [];

  for(var quad of quads) {

    var subjectValue = `<${quad.subject.value}>`;
    var predicateValue = `<${quad.predicate.value}>`;
    var objectValue = `<${quad.object.value}>`;

    if (quad.object.termType == 'Literal') {
      objectValue = `${quad.object.id}`
    }

    triples.push(`${subjectValue} ${predicateValue} ${objectValue} .`);
  }

  return triples;
}


module.exports = requestRDF;