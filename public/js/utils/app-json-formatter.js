const DatabusConstants = require("./databus-constants");
const DatabusUris = require("./databus-uris");
const DatabusUtils = require("./databus-utils");
const JsonldUtils = require("./jsonld-utils");

/**
 * Translates expanded jsonld into web-app compatible json
 */
class AppJsonFormatter {

  static createAccountData(resourceBaseUrl, accountName, accountLabel, accountStatus, accountImage) {

    var accountUri = `${resourceBaseUrl}/${accountName}`;
    var profileUri = `${resourceBaseUrl}/${accountName}${DatabusConstants.WEBID_DOCUMENT}`;
    var personUri = `${resourceBaseUrl}/${accountName}${DatabusConstants.WEBID_THIS}`;

    var accountJsonLd = {};

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = [
      DatabusUris.FOAF_PERSON,
      DatabusUris.DBP_DBPEDIAN
    ];
    personGraph[DatabusUris.FOAF_NAME] = accountLabel;

    if (accountStatus != null) {
      personGraph[DatabusUris.FOAF_STATUS] = accountStatus;
    }

    personGraph[DatabusUris.FOAF_ACCOUNT] = {};
    personGraph[DatabusUris.FOAF_ACCOUNT][DatabusUris.JSONLD_ID] = accountUri;

    if (accountImage != null) {
      personGraph[DatabusUris.FOAF_IMG] = {};
      personGraph[DatabusUris.FOAF_IMG][DatabusUris.JSONLD_ID] = accountImage;
    }

    var profileGraph = {};
    profileGraph[DatabusUris.JSONLD_ID] = profileUri;
    profileGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT;
    profileGraph[DatabusUris.FOAF_PRIMARY_TOPIC] = {};
    profileGraph[DatabusUris.FOAF_PRIMARY_TOPIC][DatabusUris.JSONLD_ID] = personUri;
    profileGraph[DatabusUris.FOAF_MAKER] = {};
    profileGraph[DatabusUris.FOAF_MAKER][DatabusUris.JSONLD_ID] = personUri;

    accountJsonLd[DatabusUris.JSONLD_GRAPH] = [
      personGraph,
      profileGraph
    ];

    return accountJsonLd;
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

    if(result.title == null) {
      result.title = DatabusUtils.uriToResourceName(result.uri);
    }

    return result;
  }

  static formatAccountData(graphs) {
    var result = {};

    var profileGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT);
    var personGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSON);

    result.uri = profileGraph[DatabusUris.JSONLD_ID];
    result.accountName = DatabusUtils.uriToResourceName(result.uri);
    result.label = JsonldUtils.getProperty(personGraph, DatabusUris.FOAF_NAME);
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

    var content = JsonldUtils.getProperty(collectionGraph, DatabusUris.DATABUS_COLLECTION_CONTENT)
    result.content = DatabusUtils.tryParseJson(unescape(content));

    return result;
  }
}

module.exports = AppJsonFormatter;
