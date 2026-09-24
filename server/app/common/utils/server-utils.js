var ASN1 = require('asn1js');
const fs = require('fs');
const axios = require('axios');
const jsonld = require('jsonld');
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
        result.info.webIds = req.databus.webIds;
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

  static toPersonWebId(accountOrWebId) {
    if (accountOrWebId == null) return null;
    const trimmed = String(accountOrWebId).trim().replace(/\/+$/, '');
    if (trimmed.includes('#')) return trimmed;
    const base = process.env.DATABUS_RESOURCE_BASE_URL;
    if (base && /^https?:\/\//i.test(trimmed)) {
      try {
        if (new URL(trimmed).host !== new URL(base).host) return trimmed;
      } catch {
        // not a URL; append #this below
      }
    }
    return `${trimmed}${DatabusConstants.WEBID_THIS}`;
  }

  static agentUri(secretaryGraph) {
    const agentNode = secretaryGraph[DatabusUris.DATABUS_AGENT]?.[0];
    if (agentNode == null) return null;
    return agentNode[DatabusUris.JSONLD_ID] || agentNode;
  }

  static secretaryAllowsWrite(req, secretaryGraph, resourceUri) {
    const agentUri = ServerUtils.agentUri(secretaryGraph);
    const webIds = req.databus?.webIds || [];
    if (agentUri == null || !webIds.includes(agentUri)) {
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

  static sameHost(left, right) {
    try {
      return new URL(left).host === new URL(right).host;
    } catch {
      return false;
    }
  }

  static accountUriForName(accountName) {
    if (accountName == null) return null;
    if (/^https?:\/\//i.test(accountName)) return accountName;
    return `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
  }

  static sharesHostWithCaller(accountUri, accounts) {
    if (!Array.isArray(accounts) || !ServerUtils.sameHost(accountUri, process.env.DATABUS_RESOURCE_BASE_URL)) {
      return false;
    }

    return accounts.some(acc => ServerUtils.sameHost(ServerUtils.accountUriForName(acc.accountName), accountUri));
  }

  static async secretaryGraphsFromSparql(accountUri) {
    if (/[<>"\s{}]/.test(accountUri)) return null;

    const exec = require('../execute-query');
    const query = ServerUtils.formatQuery(require('../queries/sparql/get-account-secretaries.sparql'), {
      ACCOUNT_URI: accountUri,
    });
    const bindings = await exec.executeSelect(query);
    if (bindings == null) return null;

    const graphs = new Map();
    for (const row of bindings) {
      let graph = graphs.get(row.secretary);
      if (graph == null) {
        graph = {
          [DatabusUris.DATABUS_AGENT]: [{ [DatabusUris.JSONLD_ID]: row.agent }],
        };
        graphs.set(row.secretary, graph);
      }
      if (row.writeAccess) {
        const list = graph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO] || [];
        list.push({ [DatabusUris.JSONLD_ID]: row.writeAccess });
        graph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO] = list;
      }
    }

    return [...graphs.values()];
  }

  static async secretaryGraphsFromUrl(accountUri) {
    const response = await axios.get(accountUri, {
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
      }
    });
    const expanded = await jsonld.expand(response.data);
    const personId = ServerUtils.toPersonWebId(accountUri);
    return expanded
      .filter(node => node['@id'] === personId)
      .flatMap(node => node[DatabusUris.DATABUS_SECRETARY_PROPERTY] || []);
  }

  static async loadSecretaryGraphs(accountUri, accounts) {
    let secretaryGraphs = null;
    if (ServerUtils.sharesHostWithCaller(accountUri, accounts)) {
      try {
        secretaryGraphs = await ServerUtils.secretaryGraphsFromSparql(accountUri);
      } catch (_) {
        secretaryGraphs = null;
      }
    }

    if (secretaryGraphs == null) {
      try {
        secretaryGraphs = await ServerUtils.secretaryGraphsFromUrl(accountUri);
      } catch (_) {
        return null;
      }
    }

    return secretaryGraphs;
  }

  static async actorWebId(req, accountUri, resourceUri) {
    const ownerWebId = ServerUtils.toPersonWebId(accountUri);
    const webIds = req.databus?.webIds || [];
    if (webIds.includes(ownerWebId)) return ownerWebId;

    const secretaryGraphs = await ServerUtils.loadSecretaryGraphs(accountUri, req.databus?.accounts);
    if (secretaryGraphs == null) return null;

    for (const secretaryGraph of secretaryGraphs) {
      if (ServerUtils.secretaryAllowsWrite(req, secretaryGraph, resourceUri || accountUri)) {
        return ServerUtils.agentUri(secretaryGraph);
      }
    }

    return null;
  }

  static async hasWriteAccess(req, accountName, resourceUri) {
    var accounts = req.databus.accounts;
    let accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

    if (accounts != null && accounts.some(acc => acc.accountName == accountName)) {
      return true;
    }

    const onBehalfOf = req.headers['x-on-behalf-of'];
    const principalWebId = ServerUtils.toPersonWebId(accountUri);
    if (onBehalfOf && onBehalfOf !== principalWebId) {
      return false;
    }

    const targetUri = resourceUri || accountUri;
    const secretaryGraphs = await ServerUtils.loadSecretaryGraphs(accountUri, accounts);
    if (secretaryGraphs == null) {
      return false;
    }

    for (var secretaryGraph of secretaryGraphs) {
      if (ServerUtils.secretaryAllowsWrite(req, secretaryGraph, targetUri)) {
        return true;
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

    if (secretaries != null) {
      personGraph[DatabusUris.DATABUS_SECRETARY_PROPERTY] = [];

      for (var secretary of secretaries) {
        let secretaryGraph = {};
        secretaryGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_SECRETARY;
        secretaryGraph[DatabusUris.DATABUS_AGENT] = JsonldUtils.refTo(
          ServerUtils.toPersonWebId(secretary.accountName)
        );

        if (secretary.hasWriteAccessTo != undefined) {
          secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO] = [];

          for (var writeAccess of secretary.hasWriteAccessTo) {
            secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO].push(JsonldUtils.refTo(writeAccess));
          }
        }

        personGraph[DatabusUris.DATABUS_SECRETARY_PROPERTY].push(secretaryGraph);
      }
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
  console.assert(ServerUtils.toPersonWebId(`${base}`) === `${base}#this`);
  console.assert(ServerUtils.toPersonWebId(`${base}#this`) === `${base}#this`);
  const prevBase = process.env.DATABUS_RESOURCE_BASE_URL;
  process.env.DATABUS_RESOURCE_BASE_URL = 'https://databus.example.org';
  console.assert(ServerUtils.toPersonWebId('https://other.example/alice#me') === 'https://other.example/alice#me');
  console.assert(ServerUtils.toPersonWebId('https://other.example/alice') === 'https://other.example/alice');
  console.assert(ServerUtils.toPersonWebId('https://databus.example.org/mike') === 'https://databus.example.org/mike#this');
  process.env.DATABUS_RESOURCE_BASE_URL = prevBase;
}

module.exports = ServerUtils
