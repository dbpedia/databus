var rdfstore = require('rdfstore');
var self = {};


// Possibly exec stuff on CLI
const { exec } = require('child_process');


function escapeQuotes(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r');
}
/**
 * 
 * @param {*} jsonld
 * @param {*} query 
 */
self.executeConstruct = async function (jsonld, query) {

  try {
    
    var store = await self.createStore();

    var tripleCount = await self.loadJsonld(store, jsonld);
    console.log(tripleCount);

    var graph = await self.queryStore(store, query);
    var triples = self.convertToN3(graph);


    return triples;
  } catch(err) {
    console.log(err);
    return '';
  }
}

self.convertToN3 = function (graph) {
  var triples = '';

  for (var triple of graph.triples) {

    var subjectValue = `<${triple.subject.nominalValue}>`;
    var predicateValue = `<${triple.predicate.nominalValue}>`;
    var objectValue = `<${triple.object.nominalValue}>`;
    var dataType = ``;

    if(triple.object.datatype) {
      dataType = `^^<${triple.object.datatype}>`
    }

    if (triple.object.interfaceName == 'Literal') {

      objectValue = `"${escapeQuotes(triple.object.nominalValue)}"${dataType}`

      if (triple.object.language != undefined) {
        objectValue += `@${triple.object.language}`;
      }
      
    }

    triples += `${subjectValue} ${predicateValue} ${objectValue} .\n`;
  }

  return triples;
}

self.queryStore = function (store, query) {
  return new Promise(function (resolve, reject) {
    store.execute(query, function (err, graph) {
      if (err != undefined) {
        reject(err);
      } else {
        resolve(graph);
      }
    });
  });
}

self.loadJsonld = function (store, jsonld) {
  return new Promise(function (resolve, reject) {
    store.load("application/ld+json", jsonld, function (err, results) {
      if (err != undefined) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

self.createStore = function () {
  return new Promise(function (resolve, reject) {
    rdfstore.create(function (err, store) {
      if (err != undefined) {
        reject(err);
      } else {
        resolve(store);
      }
    });
  });
}

module.exports = self
