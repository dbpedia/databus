var sanitizeUrl = require('@braintree/sanitize-url').sanitizeUrl;
var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL || 'localhost';

class UriUtils {

  /**
* Creates a resource URI from configured resource base uri and passed path
* TODO write tests
* @param  {[type]} path [description]
* @return {[type]}      [description]
*/
  static createResourceUri(path) {

    var result = baseUrl;

    for (var p in path) {
      result += "/" + encodeURI(path[p]);
    }

    return sanitizeUrl(result);
  }

  static isResourceUri(uri, path) {

    if (!uri.startsWith(baseUrl)) {
      return false;
    }

    if (path != undefined && uri !== baseUrl + path) {
      return false;
    }

    return true;
  }

  static splitResourceUri(uri) {
    uri = uri.replace(baseUrl, '');
    if(uri.startsWith('/')) {
      uri = uri.substr(1);
    }

    return uri.split('/');
  }



  static uriToName(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);
    result = result.substr(result.lastIndexOf('#') + 1);
    return result;
  }

  static uriToLabel(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);
    result = result.substr(result.lastIndexOf('#') + 1);
    return result;
  }

  static navigateUp(uri) {

  }

  static sanitizeUri(uri) {
    return sanitizeUrl(uri);
  }

  static sanitizeResourceUri(uri) {
    return sanitizeUrl(uri);
  }
}

module.exports = UriUtils;