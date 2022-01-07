class DatabusUris {

  // JSONLD
  static JSONLD_TYPE = '@type';
  static JSONLD_ID = '@id';
  static JSONLD_VALUE = '@value';
  static JSONLD_LANGUAGE = '@language';

  // DATAID
  static DATAID_DATASET = 'http://dataid.dbpedia.org/ns/core#Dataset';
  static DATAID_SINGLE_FILE = 'http://dataid.dbpedia.org/ns/core#SingleFile';
  static DATAID_VERSION = 'http://dataid.dbpedia.org/ns/core#Version';
  static DATAID_ARTIFACT = 'http://dataid.dbpedia.org/ns/core#Artifact';
  static DATAID_VERSION_PROPERTY = 'http://dataid.dbpedia.org/ns/core#version';
  static DATAID_GROUP_PROPERTY = 'http://dataid.dbpedia.org/ns/core#group';
  static DATAID_ARTIFACT_PROPERTY = 'http://dataid.dbpedia.org/ns/core#artifact';

  // DCT
  static DCT_PUBLISHER = 'http://purl.org/dc/terms/publisher';
  static DCT_HAS_VERSION = 'http://purl.org/dc/terms/hasVersion';
  static DCT_ISSUED = 'http://purl.org/dc/terms/issued';
  static DCT_CREATED = 'http://purl.org/dc/terms/created';
  static DCT_MODIFIED = 'http://purl.org/dc/terms/modified';

  // SEC
  static SEC_PROOF = 'https://w3id.org/security#proof';

  // DATABUS
  static DATABUS_TRACTATE_V1 = 'https://databus.dbpedia.org/system/ontology#DatabusTractateV1';

  // RDF
  static RDF_PROPERTY = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property';

  // XSD
  static XSD_DATE_TIME = 'http://www.w3.org/2001/XMLSchema#dateTime';
}
module.exports = DatabusUris;