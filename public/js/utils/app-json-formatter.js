const DatabusConstants = require("./databus-constants");
const DatabusUris = require("./databus-uris");
const DatabusUtils = require("./databus-utils");
const JsonldUtils = require("./jsonld-utils");

/**
 * Translates expanded jsonld into web-app compatible json
 */
class AppJsonFormatter {

  static async createAccountGraphs(uri, name, label, img, secretaries, status) {
    var name = UriUtils.uriToName(uri);
  
    var rsaKeyGraph = {};
    rsaKeyGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.CERT_RSA_PUBLIC_KEY;
    rsaKeyGraph[DatabusUris.RDFS_LABEL] = DatabusConstants.WEBID_SHARED_PUBLIC_KEY_LABEL;
    rsaKeyGraph[DatabusUris.CERT_MODULUS] = signer.getModulus();
    rsaKeyGraph[DatabusUris.CERT_EXPONENT] = 65537;
  
    var personUri = `${uri}${DatabusConstants.WEBID_THIS}`;

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = [ DatabusUris.FOAF_PERSON, DatabusUris.DBP_DBPEDIAN ];
    personGraph[DatabusUris.FOAF_ACCOUNT] = JsonldUtils.refTo(uri);
    personGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = uri;
    personGraph[DatabusUris.CERT_KEY] = [ rsaKeyGraph ];
    personGraph[DatabusUris.FOAF_NAME] = label;

    if(img != null) {
      personGraph[DatabusUris.FOAF_IMG] = img;
    }

     if(status != null) {
      personGraph[DatabusUris.FOAF_STATUS] = status;
    }

    if(secretaries != null) {
      personGraph[DatabusUris.DATABUS_SECRETARY_PROPERTY] = [];

      for(var secretary of secretaries) {
        let secretaryGraph = {};
        secretaryGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_SECRETARY;
        const agentUri = String(secretary.accountName).endsWith(DatabusConstants.WEBID_THIS)
          ? secretary.accountName
          : `${secretary.accountName}${DatabusConstants.WEBID_THIS}`;
        secretaryGraph[DatabusUris.DATABUS_AGENT] = JsonldUtils.refTo(agentUri);

        if(secretary.hasWriteAccessTo != undefined) {
          secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO] = [];

          for(var writeAccess of secretary.hasWriteAccessTo) {
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
  
  static createAccountData(accountUri, accountLabel, accountStatus, accountImage) {

    var personUri = `${accountUri}${DatabusConstants.WEBID_THIS}`;

    var accountJsonLd = {};

    var accountGraph = {};
    accountGraph[DatabusUris.JSONLD_ID] = accountUri;
    accountGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_ACCOUNT;

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.FOAF_PERSON;
    personGraph[DatabusUris.FOAF_NAME] = accountLabel;
    personGraph[DatabusUris.FOAF_ACCOUNT] = JsonldUtils.refTo(accountUri);

    if (accountStatus != null) {
      personGraph[DatabusUris.FOAF_STATUS] = accountStatus;
    }

    if (accountImage != null) {
      personGraph[DatabusUris.FOAF_IMG] = JsonldUtils.refTo(accountImage);
    }


    return [
      accountGraph,
      personGraph
    ];
  }

  static formatGroupData(graphs) {
    var result = {};

    // ?uri ?title ?abstract ?description
    var groupGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_GROUP);

    result.uri = groupGraph[DatabusUris.JSONLD_ID];
    result.title = JsonldUtils.getProperty(groupGraph, DatabusUris.DCT_TITLE);
    result.abstract = JsonldUtils.getProperty(groupGraph, DatabusUris.DCT_ABSTRACT);
    result.description = JsonldUtils.getProperty(groupGraph, DatabusUris.DCT_DESCRIPTION);
    result.name = DatabusUtils.uriToResourceName(result.uri);
    return result;
  }

  static formatArtifactData(graphs) {
    var result = {};
    // ?uri ?title ?abstract ?description
    var artifactGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_ARTIFACT);

    result.uri = artifactGraph[DatabusUris.JSONLD_ID];
    result.title = JsonldUtils.getProperty(artifactGraph, DatabusUris.DCT_TITLE);
    result.abstract = JsonldUtils.getProperty(artifactGraph, DatabusUris.DCT_ABSTRACT);
    result.description = JsonldUtils.getProperty(artifactGraph, DatabusUris.DCT_DESCRIPTION);
    result.name = DatabusUtils.uriToResourceName(result.uri);
    return result;


  }

  static formatAccountData(graphs) {
    var result = {};

    var accountGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_ACCOUNT);
    var personGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSON);

    result.uri = accountGraph[DatabusUris.JSONLD_ID];
    result.accountName = DatabusUtils.uriToResourceName(result.uri);
    result.label = JsonldUtils.getFirstProperty(personGraph, DatabusUris.FOAF_NAME);
    result.imageUrl = JsonldUtils.getFirstProperty(personGraph, DatabusUris.FOAF_IMG);
    result.about = JsonldUtils.getFirstProperty(personGraph, DatabusUris.FOAF_STATUS);
    result.webIds = [];
    result.searchExtensions = [];

    var extensionGraphs = JsonldUtils.getTypedGraphs(graphs, DatabusUris.DATABUS_SEARCH_EXTENSION);

    for (var extensionGraph of extensionGraphs) {
      result.searchExtensions.push({
        endpointUri: JsonldUtils.getProperty(extensionGraph, DatabusUris.DATABUS_SEARCH_EXTENSION_ENDPOINT),
        adapterName: JsonldUtils.getProperty(extensionGraph, DatabusUris.DATABUS_SEARCH_EXTENSION_ADAPTER),
      });
    }

    for (var graph of graphs) {

      if (graph[DatabusUris.JSONLD_ID] == personGraph[DatabusUris.JSONLD_ID]) {
        continue;
      }

      if (graph[DatabusUris.FOAF_ACCOUNT] != undefined) {
        result.webIds.push(graph[DatabusUris.JSONLD_ID]);
      }
    }

    result.secretaries = [];
    var secretaryIds = JsonldUtils.getRefArrayProperty(personGraph, DatabusUris.DATABUS_SECRETARY_PROPERTY);

    for (var secretaryId of secretaryIds) {
      var secretaryGraph = JsonldUtils.getGraphById(graphs, secretaryId);
      if (secretaryGraph == null) continue;

      var secretaryData = {
        accountName: JsonldUtils.getProperty(secretaryGraph, DatabusUris.DATABUS_AGENT),
        hasWriteAccessTo: []
      };

      var writeAccessUris = secretaryGraph[DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO];

      if (Array.isArray(writeAccessUris)) {
        for (var item of writeAccessUris) {
          if (typeof item === 'object' && item['@id']) {
            secretaryData.hasWriteAccessTo.push(item['@id']);
          } else if (typeof item === 'string') {
            secretaryData.hasWriteAccessTo.push(item);
          }
        }
      }

      result.secretaries.push(secretaryData);
    }

    return result;
  }

  static formatVersionData(versionGraph) {


    var version = {};
    version.uri = versionGraph[DatabusUris.JSONLD_ID];
    version.title = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_TITLE);
    version.abstract = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_ABSTRACT);
    version.description = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_DESCRIPTION);
    version.artifact = JsonldUtils.getProperty(versionGraph, DatabusUris.DATABUS_ARTIFACT_PROPERTY);
    version.license = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_LICENSE);
    version.attribution = JsonldUtils.getProperty(versionGraph, DatabusUris.DATABUS_ATTRIBUTION);
    version.wasDerivedFrom = JsonldUtils.getProperty(versionGraph, DatabusUris.PROV_WAS_DERIVED_FROM);
    version.issued = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_ISSUED);
    version.name = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_HAS_VERSION);

    return version;
  }

  static formatCollectionData(graphs) {
    var collectionGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_COLLECTION);

    var result = {};

    result.uri = collectionGraph[DatabusUris.JSONLD_ID];
    result.title = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_TITLE);
    result.abstract = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_ABSTRACT);
    result.description = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_DESCRIPTION);
    result.issued = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_ISSUED);
    result.publisher = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_PUBLISHER);
    result.account = JsonldUtils.getProperty(collectionGraph, DatabusUris.DATABUS_ACCOUNT_PROPERTY);

    var content = JsonldUtils.getProperty(collectionGraph, DatabusUris.DATABUS_COLLECTION_CONTENT)
    result.content = DatabusUtils.tryParseJson(unescape(content));

    return result;
  }
}

module.exports = AppJsonFormatter;
