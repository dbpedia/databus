
const JsonldUtils = require('./utils/jsonld-utils');
const UriUtils = require('./utils/uri-utils');
const DatabusUris = require('./utils/databus-uris');

var autocompleter = {};

function autocompleteResourceUri(datasetGraph, prop, navUpAmount) {
  var uri = JsonldUtils.getFirstObjectUri(datasetGraph, prop);
  if (uri == null) {
    datasetGraph[prop] = [{ '@id': UriUtils.navigateUp(datasetGraph['@id'], navUpAmount) }];
  }
}

function autocompleteResourceEntry(expandedGraph, prop, navUpAmount) {

  var resourceGraph = JsonldUtils.getTypedGraph(expandedGraph, prop);
  if (resourceGraph != undefined) {
    return;
  }

  var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);
  var resourceUri = UriUtils.navigateUp(datasetGraph['@id'], navUpAmount);

  expandedGraph.push({
    '@id': resourceUri,
    '@type': prop
  });
}

autocompleter.autocomplete = function (expandedGraph) {

  var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);
  var datasetUri = datasetGraph['@id'];

  // check path length (has to be four)
  if (UriUtils.getResourcePathLength(datasetUri) != 4) {
    return;
  }

  // Auto-generate publisher entry
  var publisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DCT_PUBLISHER);

  if (publisherUri == null) {
    var accountUri = UriUtils.navigateUp(datasetUri, 3);
    datasetGraph[DatabusUris.DCT_PUBLISHER] = [{}];
    datasetGraph[DatabusUris.DCT_PUBLISHER][0][DatabusUris.JSONLD_ID] = `${accountUri}#this`;
  }

  // Auto-generate resource references
  autocompleteResourceUri(datasetGraph, DatabusUris.DATAID_GROUP_PROPERTY, 2);
  autocompleteResourceUri(datasetGraph, DatabusUris.DATAID_ARTIFACT_PROPERTY, 1);
  autocompleteResourceUri(datasetGraph, DatabusUris.DATAID_VERSION_PROPERTY, 0);

  var timeString = new Date(Date.now()).toISOString();

  if (datasetGraph[DatabusUris.DCT_CREATED] == undefined) {
    datasetGraph[DatabusUris.DCT_CREATED] = [{}];
    datasetGraph[DatabusUris.DCT_CREATED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
    datasetGraph[DatabusUris.DCT_CREATED][0][DatabusUris.JSONLD_VALUE] = timeString;
  }

  datasetGraph[DatabusUris.DCT_ISSUED] = [{}];
  datasetGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
  datasetGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;

  // Auto-generate resource entries
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_VERSION, 0);
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_ARTIFACT, 1);

  var fileGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_SINGLE_FILE);

  // Auto-complete versions
  for (var fileGraph of fileGraphs) {
    if (fileGraph[DatabusUris.DCT_HAS_VERSION] == undefined) {
      fileGraph[DatabusUris.DCT_HAS_VERSION] = datasetGraph[DatabusUris.DCT_HAS_VERSION];

      fileGraph[DatabusUris.DCT_ISSUED] = [{}];
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;

    }
  }

  //console.log(`Autocompletion DONE ================`);
  //console.log(JSON.stringify(expandedGraph, null, 3));
  //console.log(`===============================`);
}

module.exports = autocompleter;