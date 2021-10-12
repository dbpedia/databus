const RDF_URIS = {
  DATASET: 'http://dataid.dbpedia.org/ns/core#Dataset',
  DB_TRACTATE_V1: 'https://databus.dbpedia.org/system/ontology#DatabusTractateV1',
  PROP_PUBLISHER: 'http://purl.org/dc/terms/publisher',
  PROOF: 'https://w3id.org/security#proof',
  TYPE: '@type',
  VERSION: 'http://dataid.dbpedia.org/ns/core#Version',
  ARTIFACT: 'http://dataid.dbpedia.org/ns/core#Artifact',
  GROUP: 'http://dataid.dbpedia.org/ns/core#Group',
  PROP_VERSION: 'http://dataid.dbpedia.org/ns/core#version',
  PROP_ARTIFACT: 'http://dataid.dbpedia.org/ns/core#artifact',
  PROP_GROUP: 'http://dataid.dbpedia.org/ns/core#group',
  SINGLE_FILE: 'http://dataid.dbpedia.org/ns/core#SingleFile',
  PROPERTY: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'
}

RDF_URIS.datasetConstructConfig = {};

RDF_URIS.datasetConstructConfig['http://dataid.dbpedia.org/ns/core#Dataset'] = {
  'http://dataid.dbpedia.org/ns/core#artifact': true,
  'http://dataid.dbpedia.org/ns/core#group': true,
  'http://dataid.dbpedia.org/ns/core#version': true,
  'http://purl.org/dc/terms/title': true,
  'http://purl.org/dc/terms/abstract': true,
  'http://purl.org/dc/terms/description': true,
  'http://purl.org/dc/terms/hasVersion': true,
  'http://purl.org/dc/terms/issued': true,
  'http://purl.org/dc/terms/license': true,
  'http://purl.org/dc/terms/publisher': true,
  'http://www.w3.org/ns/dcat#distribution': false
};

RDF_URIS.datasetConstructConfig['http://dataid.dbpedia.org/ns/core#SingleFile'] = {
  'http://dataid.dbpedia.org/ns/core#compression': true,
  'http://dataid.dbpedia.org/ns/core#file': true,
  'http://dataid.dbpedia.org/ns/core#formatExtension': true,
  'http://dataid.dbpedia.org/ns/core#sha256sum': true,
  'http://purl.org/dc/terms/hasVersion': true,
  'http://purl.org/dc/terms/issued': true,
  'http://www.w3.org/ns/dcat#byteSize': true,
  'http://www.w3.org/ns/dcat#downloadURL': true
};


module.exports = RDF_URIS;