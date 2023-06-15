const DatabusUris = require("./databus-uris");
const DatabusUtils = require("./databus-utils");
const JsonldUtils = require("./jsonld-utils");

/**
 * Translates expanded jsonld into web-app compatible json
 */
class AppJsonFormatter {

  static formatAccountData(graphs) {
    var result = {};

    var profileGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT);
    var personGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSON);

    result.uri = profileGraph[DatabusUris.JSONLD_ID];
    result.accountName = DatabusUtils.uriToName(result.uri);
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
    version.artifact = JsonldUtils.getProperty(versionGraph, DatabusUris.DATAID_ARTIFACT_PROPERTY);
    version.license = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_LICENSE);
    version.attribution = JsonldUtils.getProperty(versionGraph, DatabusUris.DATAID_ATTRIBUTION);
    version.wasDerivedFrom = JsonldUtils.getProperty(versionGraph, DatabusUris.PROV_WAS_DERIVED_FROM);
    version.issued = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_ISSUED);
    version.name = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_HAS_VERSION);

    return version;
  }

  static formatCollectionData(graphs) {
    var collectionGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATAID_COLLECTION);

    var result = {};

    result.uri = collectionGraph[DatabusUris.JSONLD_ID];
    result.title = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_TITLE);
    result.abstract = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_ABSTRACT);
    result.description = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_DESCRIPTION);
    result.issued = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_ISSUED);
    result.publisher = JsonldUtils.getProperty(collectionGraph, DatabusUris.DCT_PUBLISHER);

    var content = JsonldUtils.getProperty(collectionGraph, DatabusUris.DATAID_CONTENT)
    result.content = DatabusUtils.tryParseJson(unescape(content));

    return result;
  }
}

module.exports = AppJsonFormatter;
