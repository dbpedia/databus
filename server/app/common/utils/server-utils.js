var ASN1 = require('asn1js');

class ServerUtils {



  static getRSAModulusAndExponent(pubkey) {
    var unarmor = /-----BEGIN PUBLIC KEY-----([A-Za-z0-9+\/=\s]+)-----END PUBLIC KEY-----/;
    try {
      var pubkeyAsn1 = ASN1.decode(Base64.decode(unarmor.exec(pubkey)[1]));
      var modulusRaw = pubkeyAsn1.sub[1].sub[0].sub[0];
      var modulusStart = modulusRaw.header + modulusRaw.stream.pos + 1;
      var modulusEnd = modulusRaw.length + modulusRaw.stream.pos + modulusRaw.header;
      var modulusHex = modulusRaw.stream.hexDump(modulusStart, modulusEnd);
      var modulus = Hex.decode(modulusHex);
      var exponentRaw = pubkeyAsn1.sub[1].sub[0].sub[1];
      var exponentStart = exponentRaw.header + exponentRaw.stream.pos;
      var exponentEnd = exponentRaw.length + exponentRaw.stream.pos + exponentRaw.header;
      var exponentHex = exponentRaw.stream.hexDump(exponentStart, exponentEnd);
      var exponent = Hex.decode(exponentHex);

      return { success: true, msg: { moduls: modulus, exponent: exponent } };
    }
    catch (err) {
      console.log(err)
      return { success: false, msg: "Failed validating RSA public key." };
    }
  }

  /**
   * Deprecated, use formatTemplate
   */
  static formatQuery(query, placeholderMappings) {

    if (placeholderMappings == undefined) {
      return query;
    }

    for (var placeholder in placeholderMappings) {
      var re = new RegExp('%' + placeholder + '%', "g");

      var insert = placeholderMappings[placeholder];

      query = query.replace(re, insert);
    }

    return query;
  }

  /**
   * placeHolderMappings is a map string => string. This function replaces all
   * occurrances of %key% in query with value.
   */
  static formatTemplate(query, placeholderMappings) {

    if (placeholderMappings == undefined) {
      return query;
    }

    for (var placeholder in placeholderMappings) {
      var re = new RegExp('%' + placeholder + '%', "g");

      var insert = placeholderMappings[placeholder];

      query = query.replace(re, insert);
    }

    return query;
  }

  static formatJsonTemplate(template, placeholderMappings) {

    if (placeholderMappings == undefined) {
      return template;
    }

    var resultString = JSON.stringify(template);

    for (var placeholder in placeholderMappings) {
      var re = new RegExp('%' + placeholder + '%', "g");

      var insert = placeholderMappings[placeholder];

      resultString = resultString.replace(re, insert);
    }

    return JSON.parse(resultString);
  }

  /**
   * Retrieves user info from the https request and returns it in a
   * more readable form
   * @param  {[type]} request [description]
   * @return {[type]}         [description]
   */
  static getAuthInfoFromRequest(req) {

    var result = {};
    result.authenticated = false;

    if (req.databus != undefined) {
      result.authenticated = req.databus.authenticated; //.isAuthenticated();
    }

    result.info = {};

    if (result.authenticated) {

      // result.info.name = req.oidc.user.name;

      if (req.databus != undefined) {
        result.info.accounts = req.databus.accounts;
        result.info.oidc_name = req.databus.oidc_name;
        result.info.oidc_email = req.databus.oidc_email;
        result.info.apiKeys = req.databus.apiKeys;
      }
    }

    /*
          var result = {};
          result.authenticated = false;
    
          if (request.kauth != undefined && request.kauth.grant != undefined) {
    
             result.authenticated = true;
             result.info = {};
             result.info.name = request.kauth.grant.id_token.content.name;
             result.info.username = request.kauth.grant.id_token.content.preferred_username;
             try {
                result.info.roles = request.kauth.grant.access_token.content.resource_access.website.roles;
             } catch (e) {
                result.info.roles = [];
             }
          }
    */
    return result;
  };

  static getRequestUri(request) {
    let host = request.hostname;
    let headerHost = request.headers.host.split(':');
    let port = headerHost[1] || '';
    let protocol = host == 'localhost' ? 'http' : 'https';
    return protocol + '://' + host + (port === '' ? '' : ':' + port);
  }

  static NOT_HTML_ACCEPTED(req, res, next) {
    var acceptHeader = req.get('Accept');

    if (acceptHeader == undefined) {
      return next();
    }

    if (acceptHeader.includes('html')) {
      return next("route");
    }

    return next();
  }

  static HTML_ACCEPTED(req, res, next) {
    var acceptHeader = req.get('Accept');

    if (acceptHeader == undefined) {
      return next("route");
    }

    return acceptHeader.includes("html") ? next() : next("route");
  }

  static RDF_ACCEPTED(req, res, next) {
    var acceptHeader = req.get('Accept');
    return acceptHeader.includes('rdf+turtle') ? next() : next("route");
  }

  static SPARQL_ACCEPTED(req, res, next) {
    var acceptHeader = req.get('Accept');
    return acceptHeader.includes('sparql') ? next() : next("route");
  }

  static JSON_ACCEPTED(req, res, next) {
    var acceptHeader = req.get('Accept');
    return acceptHeader.includes('json') ? next() : next("route");
  }

  static WGET(req, res, next) {

  }
}

module.exports = ServerUtils
