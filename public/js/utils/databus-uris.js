
class DatabusUris {

  // JSONLD
  static JSONLD_TYPE = '@type';
  static JSONLD_ID = '@id';
  static JSONLD_VALUE = '@value';
  static JSONLD_LANGUAGE = '@language';
  static JSONLD_CONTEXT = '@context';
  static JSONLD_GRAPH = '@graph';

  // Databus
  static DATABUS_DATABUS = 'https://dataid.dbpedia.org/databus#Databus';
  static DATABUS_PART = 'https://dataid.dbpedia.org/databus#Part';
  static DATABUS_VERSION = 'https://dataid.dbpedia.org/databus#Version';
  static DATABUS_GROUP = 'https://dataid.dbpedia.org/databus#Group';
  static DATABUS_ACCOUNT = 'https://dataid.dbpedia.org/databus#Account';
  static DATABUS_ARTIFACT = 'https://dataid.dbpedia.org/databus#Artifact';
  static DATABUS_VERSION_PROPERTY = 'https://dataid.dbpedia.org/databus#version';
  static DATABUS_GROUP_PROPERTY = 'https://dataid.dbpedia.org/databus#group';
  static DATABUS_ACCOUNT_PROPERTY = 'https://dataid.dbpedia.org/databus#account';
  static DATABUS_NAME = 'https://dataid.dbpedia.org/databus#name';
  static DATABUS_GRANTS_WRITE_ACCESS_TO = 'https://dataid.dbpedia.org/databus#grantsWriteAccessTo';
  static DATABUS_ARTIFACT_PROPERTY = 'https://dataid.dbpedia.org/databus#artifact';
  static DATABUS_FORMAT = 'https://dataid.dbpedia.org/databus#format';
  static DATABUS_FORMAT_EXTENSION = 'https://dataid.dbpedia.org/databus#formatExtension';
  static DATABUS_CONTENT_VARIANT = 'https://dataid.dbpedia.org/databus#contentVariant';
  static DATABUS_CONTENT_VARIANT_PREFIX = 'https://dataid.dbpedia.org/databus-cv#';
  static DATABUS_SHASUM = 'https://dataid.dbpedia.org/databus#sha256sum';
  static DATABUS_COLLECTION = 'https://dataid.dbpedia.org/databus#Collection';
  static DATABUS_FILE = 'https://dataid.dbpedia.org/databus#file';
  static DATABUS_COMPRESSION = 'https://dataid.dbpedia.org/databus#compression';
  static DATABUS_ATTRIBUTION = 'https://dataid.dbpedia.org/databus#attribution';
  static DATABUS_PREVIEW = 'https://dataid.dbpedia.org/databus#preview';
  static DATABUS_COLLECTION_CONTENT = 'https://dataid.dbpedia.org/databus#collectionContent';
  static DATABUS_TRACTATE_V1 = 'https://dataid.dbpedia.org/databus#DatabusTractateV1';
  static DATABUS_PLUGIN = 'https://dataid.dbpedia.org/databus#Plugin';
  static DATABUS_SEARCH_EXTENSION = 'https://dataid.dbpedia.org/databus#SearchExtension';
  static DATABUS_SEARCH_EXTENSION_ADAPTER = 'https://dataid.dbpedia.org/databus#searchExtensionAdapter';
  static DATABUS_SEARCH_EXTENSION_ENDPOINT = 'https://dataid.dbpedia.org/databus#searchExtensionEndpoint';
  static DATABUS_EXTENDS = 'https://dataid.dbpedia.org/databus#extends';
  
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

  // RDF
  static RDF_PROPERTY = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property';

  // RDFS
  static RDFS_SUB_PROPERTY_OF = 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf';
  static RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';

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
  static FOAF_STATUS = 'http://xmlns.com/foaf/0.1/status';
  static FOAF_PERSON = 'http://xmlns.com/foaf/0.1/Person';
  static FOAF_PRIMARY_TOPIC = 'http://xmlns.com/foaf/0.1/primaryTopic';
  static FOAF_MAKER = 'http://xmlns.com/foaf/0.1/maker';
  static FOAF_ACCOUNT_NAME = 'http://xmlns.com/foaf/0.1/accountName';
  static FOAF_IMG = 'http://xmlns.com/foaf/0.1/img';

  // S4AC
  static S4AC_ACCESS_POLICY = 'http://ns.inria.fr/s4ac/v2#AccessPolicy';
  static S4AC_ACCESS_CREATE = 'http://ns.inria.fr/s4ac/v2#Create';
  static S4AC_HAS_ACCESS_PRIVILEGE = 'http://ns.inria.fr/s4ac/v2#hasAccessPrivilege';

  // CERT
  static CERT_KEY = 'http://www.w3.org/ns/auth/cert#key';
  static CERT_MODULUS = 'http://www.w3.org/ns/auth/cert#modulus';
  static CERT_EXPONENT = 'http://www.w3.org/ns/auth/cert#exponent';
  static CERT_RSA_PUBLIC_KEY = 'http://www.w3.org/ns/auth/cert#RSAPublicKey';

  // PROV
  static PROV_WAS_DERIVED_FROM = 'http://www.w3.org/ns/prov-o#wasDerivedFrom';

  // DBP
  static DBP_DBPEDIAN = 'http://dbpedia.org/ontology/DBpedian';
}

module.exports = DatabusUris;
