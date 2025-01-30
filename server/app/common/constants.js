
class Constants {

  static KEY_AUTH = 'auth';
  static KEY_FRONT = 'frontpage';
  static KEY_PUBLISHER = 'publisher';
  static KEY_SERVICES = 'services';
  static KEY_APPS = 'apps';
  static KEY_CHILDREN = 'children';
  static KEY_COLLECTIONS = 'collections';
  static KEY_COLLECTION = 'collection';
  static KEY_GROUP = 'group';
  static KEY_ARTIFACTS = 'artifacts';
  static KEY_ARTIFACT_VERSIONS = 'artifactVersions';
  static KEY_VERSION_DATA = 'versionData';
  static KEY_ACTIONS = 'actions';
  static KEY_MODS = 'mods';

  static DATABUS_LOG_DEBUG = 'log_debug';
  static DATABUS_LOG_INFO = 'log_info';
  static DATABUS_LOG_ERROR = 'log_error';


  static DATABUS_SQLITE_USER_DATABASE_DIR = '/sqlite/';
  static DATABUS_SQLITE_USER_DATABASE_PATH = '/sqlite/users.db';

  static DATAID_DEFAULT_IMAGE_URL = 'https://picsum.photos/id/223/320/320';
  static DEFAULT_DATABASE_URL = 'http://localhost:3002';
  static DATABUS_DEFAULT_CONTEXT_URL = 'https://downloads.dbpedia.org/databus/context.jsonld';
  static DATABUS_DEFAULT_CONTEXT_PATH = '/res/context.jsonld';
  static DATABUS_DEFAULT_CONTEXT = '';

  static DATABUS_FILE_GROUP = 'group.jsonld';
  static DATABUS_FILE_ARTIFACT = 'artifact.jsonld';
  static DATABUS_FILE_DATAID = 'dataid.jsonld';
  static DATABUS_FILE_WEBID = 'webid.jsonld';

  static DATABUS_FILE_COLLECTION = 'collection.jsonld';
  static DATABUS_COLLECTIONS_GROUP_IDENTIFIER = `collections`;

  static MESSAGE_WRONG_NAMESPACE = 'You cannot perform this action in a foreign namespace.\n';
  static MESSGAGE_NOT_FOUND = 'Sorry, can\'t find that!\n';

  // Internal message keys for communication from child to master process
  static DATABUS_USER_CACHE_REFRESH = 0x01;
  static DATABUS_USER_ENTRY_UPDATE = 0x02;
  static DATABUS_SEARCH_INDEX_REBUILD = 0x03;
  static DATABUS_REQUEST_USER_CACHE_REFRESH = 0x04;

  static DATABUS_OIDC_LOGIN_ROUTE = `/app/login`;
  static DATABUS_OIDC_LOGOUT_ROUTE = `/app/logout`;
  static DATABUS_OIDC_CALLBACK_ROUTE = `/app/callback`;
  static AUTH0_LOGOUT_CHECK_SEQUENCE = "auth0";

  static HTTP_CONTENT_TYPE_JSONLD = 'application/ld+json';
  static HTTP_CONTENT_TYPE_TURTLE =  'text/turtle';
  static HTTP_CONTENT_TYPE_JSON = 'application/json';
  static HTTP_CONTENT_TYPE_TEXT =  'text/plain';
  static HTTP_CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';
  
  static HTTP_ACCEPT_RDF = 'text/turtle, application/ld+json, text/plain, application/rdf+xml, application/x-turtle';

  static SHARED_DATABUS_PUBLIC_KEY = 'Databus Public Key';
}

module.exports = Constants;
