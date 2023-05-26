
class HttpStrings {

  static METHOD_GET = 'GET';
  static METHOD_POST = 'POST';
  static METHOD_PUT = 'PUT';

  // Headers
  static HEADER_CONTENT_TYPE = 'Content-Type';
  static HEADER_ACCEPT = 'Accept';
  static HEADER_JSONLD_FORMATTING = 'X-Jsonld-Formatting';

  // Content Type
  static CONTENT_TYPE_JSONLD = 'application/ld+json';
  static CONTENT_TYPE_TURTLE =  'text/turtle';
  static CONTENT_TYPE_JSON = 'application/json';
  static CONTENT_TYPE_TEXT =  'text/plain';
  static CONTENT_TYPE_NTRIPLES =  'text/ntriples';
  static CONTENT_TYPE_FORM_URL_ENCODED = 'application/x-www-form-urlencoded';

  // Accept
  static ACCEPT_RDF = 'text/turtle, application/ld+json, text/plain, application/rdf+xml, application/x-turtle';
}

module.exports = HttpStrings;
