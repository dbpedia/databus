var ASN1 = require('asn1js');
const fs = require('fs');
const axios = require('axios');
const jsonld = require('jsonld');
const DatabusResource = require('../databus-resource');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const UriUtils = require('./uri-utils');
const Constants = require('../constants');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

class ServerUtils {

  static getProxyAgent(url) {
    const target = new URL(url);
    const host = target.hostname;

    const noProxyVar =
      process.env.NO_PROXY || process.env.no_proxy || '';
    const noProxy = noProxyVar.split(',').map(s => s.trim()).filter(Boolean);

    if (noProxy.some(np => host === np || host.endsWith('.' + np)))
      return null;

    const httpsProxy =
      process.env.HTTPS_PROXY || process.env.https_proxy;
    const httpProxy =
      process.env.HTTP_PROXY || process.env.http_proxy;

    const proxyUrl = target.protocol === 'https:' ? httpsProxy : httpProxy;

    if (!proxyUrl) return null;

    const agent =
      target.protocol === 'https:'
        ? new HttpsProxyAgent(proxyUrl)
        : new HttpProxyAgent(proxyUrl);

    // Allow MITM proxy certificates (testing only)
    if (process.env.ALLOW_INSECURE_PROXY === 'true') {
      agent.options.rejectUnauthorized = false;
    }

    return agent;
  }

  static setupRequireExtensions() {
    // add a sparql file loading extension (simply read the file as a string)
    require.extensions['.sparql'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };

    require.extensions['.shacl'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };


    require.extensions['.jsonld'] = function (module, filename) {
      module.exports = JSON.parse(fs.readFileSync(filename, 'utf8'));
    };

    require.extensions['.ejs'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };

    require.extensions['.sql'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };

    require.extensions['.md'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };
    require.extensions['.ttl'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };
    require.extensions['.html'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };
  }

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


  static isUriUnderPrefix(resourceUri, prefixUri) {
    return resourceUri === prefixUri || resourceUri.startsWith(`${prefixUri}/`);
  }

  static getWriteAccessUris(secretaryGraph) {
    const entries = secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO];
    if (entries == null || entries.length === 0) {
      return [];
    }

    return entries.map(entry => entry[DatabusUris.JSONLD_ID] || entry).filter(Boolean);
  }

  static isResourceUnderWriteAccess(resourceUri, writeAccessUris) {
    if (writeAccessUris.length === 0) {
      return true;
    }

    return writeAccessUris.some(prefix => ServerUtils.isUriUnderPrefix(resourceUri, prefix));
  }

  static secretaryAllowsWrite(accounts, secretaryGraph, resourceUri) {
    const accountNode = secretaryGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY]?.[0];
    if (accountNode == null) {
      return false;
    }

    const accountResource = new DatabusResource(accountNode[DatabusUris.JSONLD_ID]);
    if (!accountResource.isAccount()) {
      return false;
    }

    const secretaryName = accountResource.getAccount();
    if (accounts == null || !accounts.some(acc => acc.accountName == secretaryName)) {
      return false;
    }

    return ServerUtils.isResourceUnderWriteAccess(resourceUri, ServerUtils.getWriteAccessUris(secretaryGraph));
  }

  static resourceUriFromRequest(req) {
    if (req.params.collection != null) {
      return UriUtils.createResourceUri([
        req.params.account,
        Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER,
        req.params.collection,
      ]);
    }

    return UriUtils.fromRequest(req);
  }

  static async hasWriteAccess(req, accountName, resourceUri) {
    var accounts = req.databus.accounts;
    let accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

    if (accounts != null && accounts.some(acc => acc.accountName == accountName)) {
      return true;
    }

    const onBehalfOf = req.headers['x-on-behalf-of'];
    const targetUri = resourceUri || accountUri;

    if (onBehalfOf && onBehalfOf == accountUri) {
      try {
        const response = await axios.get(onBehalfOf, {
          headers: {
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
          }
        });

        const expanded = await jsonld.expand(response.data);
        const secretaryGraphs = expanded.flatMap(e => e[DatabusUris.DATABUS_SECRETARY_PROPERTY] || []);

        for (var secretaryGraph of secretaryGraphs) {
          if (ServerUtils.secretaryAllowsWrite(accounts, secretaryGraph, targetUri)) {
            return true;
          }
        }

      } catch (_) {
        // fall through to error below
      }
    }

    return false;
  }

  static async createAccountGraphs(uri, name, label, img, secretaries, status) {


    const signer = require('../../api/lib/databus-tractate-suite');
    const JsonldLoader = require('./jsonld-loader');
    const jsonld = require('jsonld');
    const UriUtils = require('./uri-utils');
    const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');

    var name = UriUtils.uriToName(uri);

    var rsaKeyGraph = {};
    rsaKeyGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.CERT_RSA_PUBLIC_KEY;
    rsaKeyGraph[DatabusUris.RDFS_LABEL] = DatabusConstants.WEBID_SHARED_PUBLIC_KEY_LABEL;
    rsaKeyGraph[DatabusUris.CERT_MODULUS] = signer.getModulus();
    rsaKeyGraph[DatabusUris.CERT_EXPONENT] = 65537;

    var personUri = `${uri}${DatabusConstants.WEBID_THIS}`;

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = [DatabusUris.FOAF_PERSON, DatabusUris.DBP_DBPEDIAN];
    personGraph[DatabusUris.FOAF_ACCOUNT] = JsonldUtils.refTo(uri);
    personGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = uri;
    personGraph[DatabusUris.CERT_KEY] = [rsaKeyGraph];
    personGraph[DatabusUris.FOAF_NAME] = label;

    if (img != null) {
      personGraph[DatabusUris.FOAF_IMG] = img;
    }

    if (status != null) {
      personGraph[DatabusUris.FOAF_STATUS] = status;
    }

    var profileUri = `${uri}${DatabusConstants.WEBID_DOCUMENT}`;

    var profileDocumentGraph = {};
    profileDocumentGraph[DatabusUris.JSONLD_ID] = profileUri;
    profileDocumentGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT;
    profileDocumentGraph[DatabusUris.FOAF_MAKER] = JsonldUtils.refTo(personUri);
    profileDocumentGraph[DatabusUris.FOAF_PRIMARY_TOPIC] = JsonldUtils.refTo(personUri);

    var accountGraph = {}
    accountGraph[DatabusUris.JSONLD_ID] = uri;
    accountGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_ACCOUNT;
    accountGraph[DatabusUris.FOAF_ACCOUNT_NAME] = name;
    accountGraph[DatabusUris.DATABUS_NAME] = name;

    if (secretaries != null) {

      accountGraph[DatabusUris.DATABUS_SECRETARY_PROPERTY] = [];

      for (var secretary of secretaries) {

        let secretaryAccountUri = `${secretary.accountName}`;

        let secretaryGraph = {};
        secretaryGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_SECRETARY;
        secretaryGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = JsonldUtils.refTo(secretaryAccountUri);

        if (secretary.hasWriteAccessTo != undefined) {
          secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO] = [];

          for (var writeAccess of secretary.hasWriteAccessTo) {
            secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO].push(JsonldUtils.refTo(writeAccess));
          }
        }

        accountGraph[DatabusUris.DATABUS_SECRETARY_PROPERTY].push(secretaryGraph);
      }
    }

    let expandedGraphs = [
      accountGraph,
      personGraph,
      profileDocumentGraph
    ];

    return await jsonld.compact(expandedGraphs, JsonldLoader.DEFAULT_CONTEXT_URL);
  }
}

if (typeof process !== 'undefined' && require.main === module) {
  const base = 'https://databus.example.org/myorg';
  console.assert(ServerUtils.isUriUnderPrefix(`${base}/datasets`, `${base}/datasets`));
  console.assert(ServerUtils.isUriUnderPrefix(`${base}/datasets/artifact/1.0.0`, `${base}/datasets`));
  console.assert(!ServerUtils.isUriUnderPrefix(`${base}/other`, `${base}/datasets`));
  console.assert(ServerUtils.isResourceUnderWriteAccess(`${base}/datasets/x`, []));
  console.assert(!ServerUtils.isResourceUnderWriteAccess(`${base}/other`, [`${base}/datasets`]));
}

module.exports = ServerUtils
