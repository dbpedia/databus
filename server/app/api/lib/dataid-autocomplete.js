// MODULE COMPLETES INPUT DATAIDS
const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const ArrayUtils = require('../../common/utils/array-utils');

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
  var datasetUri = datasetGraph[DatabusUris.JSONLD_ID];

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

  if (datasetGraph[DatabusUris.DCT_ISSUED] == undefined) {
    datasetGraph[DatabusUris.DCT_ISSUED] = [{}];
    datasetGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
    datasetGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;
  }

  datasetGraph[DatabusUris.DCT_MODIFIED] = [{}];
  datasetGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
  datasetGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_VALUE] = timeString;

  // Auto-generate resource entries
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_VERSION, 0);
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_ARTIFACT, 1);

  var fileGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_PART);

  var contentVariantProperties = [];

  // Auto-complete versions
  for (var fileGraph of fileGraphs) {
    if (fileGraph[DatabusUris.DCT_HAS_VERSION] == undefined) {
      fileGraph[DatabusUris.DCT_HAS_VERSION] = datasetGraph[DatabusUris.DCT_HAS_VERSION];
    }

    /*
    if (fileGraph[DatabusUris.DATAID_FORMAT] == undefined) {
      fileGraph[DatabusUris.DATAID_FORMAT] = fileGraph[DatabusUris.DATAID_FORMAT_EXTENSION];
    }

    if (fileGraph[DatabusUris.DATAID_FORMAT_EXTENSION] == undefined) {
      fileGraph[DatabusUris.DATAID_FORMAT_EXTENSION] = fileGraph[DatabusUris.DATAID_FORMAT];
    }*/

    if (fileGraph[DatabusUris.DCT_ISSUED] == undefined) {
      fileGraph[DatabusUris.DCT_ISSUED] = [{}];
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;
    }

    for (var propertyUri in fileGraph) {
      if (propertyUri.startsWith(DatabusUris.DATAID_CONTENT_VARIANT_PREFIX)) {
        contentVariantProperties.push(propertyUri);
      }
    }
  }


  // Auto-complete content variants
  contentVariantProperties = ArrayUtils.uniqueList(contentVariantProperties)




  for (var contentVariantProperty of contentVariantProperties) {

    var propertyGraph = JsonldUtils.getGraphById(expandedGraph, contentVariantProperty);

    if (propertyGraph != undefined) {

      console.log(JSON.stringify(propertyGraph, null, 2));
      continue;
    }

    propertyGraph = {};
    propertyGraph[DatabusUris.JSONLD_ID] = contentVariantProperty;
    propertyGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.RDF_PROPERTY;
    propertyGraph[DatabusUris.RDFS_SUB_PROPERTY_OF] = [{}];
    propertyGraph[DatabusUris.RDFS_SUB_PROPERTY_OF][0][DatabusUris.JSONLD_ID]
      = DatabusUris.DATAID_CONTENT_VARIANT;


    expandedGraph.push(propertyGraph);
  }

  for (var fileGraph of fileGraphs) {


    // console.log(JSON.stringify(fileGraph['@id'], null, 3));
    
    for (var contentVariantProperty of contentVariantProperties) {

      if (fileGraph[contentVariantProperty] == undefined) {
        fileGraph[contentVariantProperty] = [{}];
        fileGraph[contentVariantProperty][0][DatabusUris.JSONLD_VALUE] = "";
      }

      // console.log(`${contentVariantProperty}: ${fileGraph[contentVariantProperty][0][DatabusUris.JSONLD_VALUE]}`);
    }


  }


  //console.log(`Autocompletion DONE ================`);
  //console.log(JSON.stringify(expandedGraph, null, 3));
  //console.log(`===============================`);
}

module.exports = autocompleter;