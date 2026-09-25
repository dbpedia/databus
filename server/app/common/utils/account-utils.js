const axios = require('axios');
const jsonld = require('jsonld');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const UriUtils = require('./uri-utils');
const Constants = require('../constants');
const ServerUtils = require('./server-utils');

class AccountUtils {

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

    return writeAccessUris.some(prefix => AccountUtils.isUriUnderPrefix(resourceUri, prefix));
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
    const agentUri = AccountUtils.agentUri(secretaryGraph);
    const webIds = req.databus?.webIds || [];
    if (agentUri == null || !webIds.includes(agentUri)) {
      return false;
    }

    return AccountUtils.isResourceUnderWriteAccess(resourceUri, AccountUtils.getWriteAccessUris(secretaryGraph));
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
    if (!Array.isArray(accounts) || !AccountUtils.sameHost(accountUri, process.env.DATABUS_RESOURCE_BASE_URL)) {
      return false;
    }

    return accounts.some(acc => AccountUtils.sameHost(AccountUtils.accountUriForName(acc.accountName), accountUri));
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
    const personId = AccountUtils.toPersonWebId(accountUri);
    return expanded
      .filter(node => node['@id'] === personId)
      .flatMap(node => node[DatabusUris.DATABUS_SECRETARY_PROPERTY] || []);
  }

  static async loadSecretaryGraphs(accountUri, accounts) {
    let secretaryGraphs = null;
    if (AccountUtils.sharesHostWithCaller(accountUri, accounts)) {
      try {
        secretaryGraphs = await AccountUtils.secretaryGraphsFromSparql(accountUri);
      } catch (_) {
        secretaryGraphs = null;
      }
    }

    if (secretaryGraphs == null) {
      try {
        secretaryGraphs = await AccountUtils.secretaryGraphsFromUrl(accountUri);
      } catch (_) {
        return null;
      }
    }

    return secretaryGraphs;
  }

  static async actorWebId(req, accountUri, resourceUri) {
    const ownerWebId = AccountUtils.toPersonWebId(accountUri);
    const webIds = req.databus?.webIds || [];
    if (webIds.includes(ownerWebId)) return ownerWebId;

    const secretaryGraphs = await AccountUtils.loadSecretaryGraphs(accountUri, req.databus?.accounts);
    if (secretaryGraphs == null) return null;

    for (const secretaryGraph of secretaryGraphs) {
      if (AccountUtils.secretaryAllowsWrite(req, secretaryGraph, resourceUri || accountUri)) {
        return AccountUtils.agentUri(secretaryGraph);
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
    const principalWebId = AccountUtils.toPersonWebId(accountUri);
    if (onBehalfOf && onBehalfOf !== principalWebId) {
      return false;
    }

    const targetUri = resourceUri || accountUri;
    const secretaryGraphs = await AccountUtils.loadSecretaryGraphs(accountUri, accounts);
    if (secretaryGraphs == null) {
      return false;
    }

    for (var secretaryGraph of secretaryGraphs) {
      if (AccountUtils.secretaryAllowsWrite(req, secretaryGraph, targetUri)) {
        return true;
      }
    }

    return false;
  }

  static async createAccountGraphs(uri, name, label, img, secretaries, status) {
    const signer = require('../../api/lib/databus-tractate-suite');
    const JsonldLoader = require('./jsonld-loader');
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
          AccountUtils.toPersonWebId(secretary.accountName)
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
  console.assert(AccountUtils.isUriUnderPrefix(`${base}/datasets`, `${base}/datasets`));
  console.assert(AccountUtils.isUriUnderPrefix(`${base}/datasets/artifact/1.0.0`, `${base}/datasets`));
  console.assert(!AccountUtils.isUriUnderPrefix(`${base}/other`, `${base}/datasets`));
  console.assert(AccountUtils.isResourceUnderWriteAccess(`${base}/datasets/x`, []));
  console.assert(!AccountUtils.isResourceUnderWriteAccess(`${base}/other`, [`${base}/datasets`]));
  console.assert(AccountUtils.toPersonWebId(`${base}`) === `${base}#this`);
  console.assert(AccountUtils.toPersonWebId(`${base}#this`) === `${base}#this`);
  const prevBase = process.env.DATABUS_RESOURCE_BASE_URL;
  process.env.DATABUS_RESOURCE_BASE_URL = 'https://databus.example.org';
  console.assert(AccountUtils.toPersonWebId('https://other.example/alice#me') === 'https://other.example/alice#me');
  console.assert(AccountUtils.toPersonWebId('https://other.example/alice') === 'https://other.example/alice');
  console.assert(AccountUtils.toPersonWebId('https://databus.example.org/mike') === 'https://databus.example.org/mike#this');
  process.env.DATABUS_RESOURCE_BASE_URL = prevBase;
}

module.exports = AccountUtils
