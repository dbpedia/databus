const DatabusUris = require('../../../public/js/utils/databus-uris');
const JsonldUtils = require('../../../public/js/utils/jsonld-utils');
const DatabusUtils = require('../../../public/js/utils/databus-utils');

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

    for(var extensionGraph of extensionGraphs) {
      result.searchExtensions.push({
        endpointUri : JsonldUtils.getProperty(extensionGraph, DatabusUris.DATABUS_SEARCH_EXTENSION_ENDPOINT),
        adapter : JsonldUtils.getProperty(extensionGraph, DatabusUris.DATABUS_SEARCH_EXTENSION_ADAPTER),
      });
    }

    for(var graph of graphs) {

      if(graph[DatabusUris.JSONLD_ID] == personGraph[DatabusUris.JSONLD_ID]) {
        continue;
      }

      if(graph[DatabusUris.FOAF_ACCOUNT] != undefined) {
        result.webIds.push(graph[DatabusUris.JSONLD_ID]);
      }
    }

    return result;
  }
}


module.exports = AppJsonFormatter;