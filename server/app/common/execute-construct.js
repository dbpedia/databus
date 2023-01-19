var rdfstore = require('rdfstore');
var self = {};


// Possibly exec stuff on CLI
const { exec } = require('child_process');


function escapeQuotes(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
/**
 * 
 * @param {*} jsonld
 * @param {*} query 
 */
self.executeConstruct = async function (jsonld, query) {

  try {

    var store = await self.createStore();
    await self.loadJsonld(store, jsonld);

    var quads = await self.queryStore(store, query);
    var triples = self.convertToN3(quads);
    return triples;
  } catch (err) {
    console.log(err);
    return '';
  }
}

self.convertToN3 = function (graph) {
  var triples = ``;

  for (var triple of graph.triples) {

    var subjectValue = `<${triple.subject.nominalValue}>`;
    var predicateValue = `<${triple.predicate.nominalValue}>`;
    var objectValue = `<${triple.object.nominalValue}>`;
    var dataType = ``;

    if (triple.object.datatype) {
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
    try {
      store.execute(query, function (err, graph) {
        if (err != undefined) {
          reject(err);
        } else {
          resolve(graph);
        }
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

self.loadJsonld = function (store, jsonld) {
  return new Promise(function (resolve, reject) {
    try {
      store.load("application/ld+json", jsonld, function (err, results) {
        if (err != undefined) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

self.createStore = function () {
  return new Promise(function (resolve, reject) {
    try {
      rdfstore.create(function (err, store) {
        if (err != undefined) {
          reject(err);
        } else {
          resolve(store);
        }
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

module.exports = self
