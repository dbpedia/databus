
class DatabusUris {

  // JSONLD
  static JSONLD_TYPE = '@type';
  static JSONLD_ID = '@id';
  static JSONLD_VALUE = '@value';
  static JSONLD_LANGUAGE = '@language';
  static JSONLD_CONTEXT = '@context';

  // DATAID
  static DATAID_DATASET = 'http://dataid.dbpedia.org/ns/core#Dataset';
  static DATAID_PART = 'http://dataid.dbpedia.org/ns/core#Part';
  static DATAID_VERSION = 'http://dataid.dbpedia.org/ns/core#Version';
  static DATAID_GROUP = 'http://dataid.dbpedia.org/ns/core#Group';
  static DATAID_ARTIFACT = 'http://dataid.dbpedia.org/ns/core#Artifact';
  static DATAID_VERSION_PROPERTY = 'http://dataid.dbpedia.org/ns/core#version';
  static DATAID_GROUP_PROPERTY = 'http://dataid.dbpedia.org/ns/core#group';
  static DATAID_ARTIFACT_PROPERTY = 'http://dataid.dbpedia.org/ns/core#artifact';
  static DATAID_FORMAT = 'http://dataid.dbpedia.org/ns/core#format';
  static DATAID_FORMAT_EXTENSION = 'http://dataid.dbpedia.org/ns/core#formatExtension';
  static DATAID_CONTENT_VARIANT = 'http://dataid.dbpedia.org/ns/core#contentVariant';
  static DATAID_CONTENT_VARIANT_PREFIX = 'http://dataid.dbpedia.org/ns/cv#';
  static DATAID_SHASUM = 'http://dataid.dbpedia.org/ns/core#sha256sum';
  static DATAID_COLLECTION = 'http://dataid.dbpedia.org/ns/core#Collection';

  // DCT
  static DCT_PUBLISHER = 'http://purl.org/dc/terms/publisher';
  static DCT_HAS_VERSION = 'http://purl.org/dc/terms/hasVersion';
  static DCT_ISSUED = 'http://purl.org/dc/terms/issued';
  static DCT_CREATED = 'http://purl.org/dc/terms/created';
  static DCT_MODIFIED = 'http://purl.org/dc/terms/modified';

  // DCAT
  static DCAT_DOWNLOAD_URL = 'http://www.w3.org/ns/dcat#downloadURL';
  static DCAT_BYTESIZE = 'http://www.w3.org/ns/dcat#byteSize';


  // SEC
  static SEC_PROOF = 'https://w3id.org/security#proof';
  static SEC_SIGNATURE = 'https://w3id.org/security#signature';

  // DATABUS
  static DATABUS_TRACTATE_V1 = 'http://dataid.dbpedia.org/ns/core#DatabusTractateV1';

  // RDF
  static RDF_PROPERTY = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property';

  // RDFS
  static RDFS_SUB_PROPERTY_OF = 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf';

  // XSD
  static XSD_DATE_TIME = 'http://www.w3.org/2001/XMLSchema#dateTime';
  static XSD_DECIMAL = 'http://www.w3.org/2001/XMLSchema#decimal';

  // SHACL
  static SHACL_VALIDATION_REPORT = 'http://www.w3.org/ns/shacl#ValidationReport';
  static SHACL_VALIDATION_RESULT = 'http://www.w3.org/ns/shacl#ValidationResult';
  static SHACL_CONFORMS = 'http://www.w3.org/ns/shacl#conforms';
  static SHACL_RESULT_MESSAGE = 'http://www.w3.org/ns/shacl#resultMessage';
}

if(typeof module === "object" && module && module.exports)
   module.exports = DatabusUris;
