
class DatabusUris {

  // JSONLD
  static JSONLD_TYPE = '@type';
  static JSONLD_ID = '@id';
  static JSONLD_VALUE = '@value';
  static JSONLD_LANGUAGE = '@language';
  static JSONLD_CONTEXT = '@context';
  static JSONLD_GRAPH = '@graph';

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
  static DATAID_FILE = 'http://dataid.dbpedia.org/ns/core#file';
  static DATAID_COMPRESSION = 'http://dataid.dbpedia.org/ns/core#compression';
  static DATAID_ATTRIBUTION = 'http://dataid.dbpedia.org/ns/core#attribution';
  static DATAID_PREVIEW = 'http://dataid.dbpedia.org/ns/core#preview';

  // DCT
  static DCT_PUBLISHER = 'http://purl.org/dc/terms/publisher';
  static DCT_HAS_VERSION = 'http://purl.org/dc/terms/hasVersion';
  static DCT_ISSUED = 'http://purl.org/dc/terms/issued';
  static DCT_CREATED = 'http://purl.org/dc/terms/created';
  static DCT_MODIFIED = 'http://purl.org/dc/terms/modified';
  static DCT_DISTRIBUTION = 'http://purl.org/dc/terms/distribution';
  static DCT_SUBJECT = 'http://purl.org/dc/terms/subject';
  static DCT_CREATOR = 'http://purl.org/dc/terms/creator'
  static DCT_TITLE = 'http://purl.org/dc/terms/title'
  static DCT_ABSTRACT = 'http://purl.org/dc/terms/abstract'
  static DCT_DESCRIPTION = 'http://purl.org/dc/terms/description'
  static DCT_LICENSE = 'http://purl.org/dc/terms/license';

  // DCAT
  static DCAT_DOWNLOAD_URL = 'http://www.w3.org/ns/dcat#downloadURL';
  static DCAT_BYTESIZE = 'http://www.w3.org/ns/dcat#byteSize';
  static DCAT_DISTRIBUTION = 'http://www.w3.org/ns/dcat#distribution';


  // SEC
  static SEC_PROOF = 'https://w3id.org/security#proof';
  static SEC_SIGNATURE = 'https://w3id.org/security#signature';

  // DATABUS
  static DATABUS_TRACTATE_V1 = 'http://dataid.dbpedia.org/ns/core#DatabusTractateV1';
  static DATABUS_PLUGIN = 'http://dataid.dbpedia.org/ns/core#Plugin';
  static DATABUS_SEARCH_EXTENSION = 'http://dataid.dbpedia.org/ns/core#SearchExtension';
  static DATABUS_SEARCH_EXTENSION_ADAPTER = 'http://dataid.dbpedia.org/ns/core#searchExtensionAdapter';
  static DATABUS_SEARCH_EXTENSION_ENDPOINT = 'http://dataid.dbpedia.org/ns/core#searchExtensionEndpoint';
  static DATABUS_EXTENDS = 'http://dataid.dbpedia.org/ns/core#extends';

  // RDF
  static RDF_PROPERTY = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property';

  // RDFS
  static RDFS_SUB_PROPERTY_OF = 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf';

  // XSD
  static XSD_DATE_TIME = 'http://www.w3.org/2001/XMLSchema#dateTime';
  static XSD_DECIMAL = 'http://www.w3.org/2001/XMLSchema#decimal';
  static XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

  // SHACL
  static SHACL_VALIDATION_REPORT = 'http://www.w3.org/ns/shacl#ValidationReport';
  static SHACL_VALIDATION_RESULT = 'http://www.w3.org/ns/shacl#ValidationResult';
  static SHACL_CONFORMS = 'http://www.w3.org/ns/shacl#conforms';
  static SHACL_RESULT_MESSAGE = 'http://www.w3.org/ns/shacl#resultMessage';

  // FOAF
  static FOAF_PERSONAL_PROFILE_DOCUMENT = 'http://xmlns.com/foaf/0.1/PersonalProfileDocument';
  static FOAF_ACCOUNT = 'http://xmlns.com/foaf/0.1/account';
  static FOAF_NAME = 'http://xmlns.com/foaf/0.1/name';
  static FOAF_PERSON = 'http://xmlns.com/foaf/0.1/Person';

  // S4AC
  static S4AC_ACCESS_POLICY = 'http://ns.inria.fr/s4ac/v2#AccessPolicy';
  static S4AC_ACCESS_CREATE = 'http://ns.inria.fr/s4ac/v2#Create';
  static S4AC_HAS_ACCESS_PRIVILEGE = 'http://ns.inria.fr/s4ac/v2#hasAccessPrivilege';

  // CERT
  static CERT_KEY = 'http://www.w3.org/ns/auth/cert#key';
  static CERT_MODULUS = 'http://www.w3.org/ns/auth/cert#modulus';
  static CERT_EXPONENT = 'http://www.w3.org/ns/auth/cert#exponent';

  // PROV
  static PROV_WAS_DERIVED_FROM = 'http://www.w3.org/ns/prov-o#wasDerivedFrom';

}

if(typeof module === "object" && module && module.exports)
   module.exports = DatabusUris;
