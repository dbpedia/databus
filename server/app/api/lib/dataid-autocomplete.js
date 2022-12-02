// MODULE COMPLETES INPUT DATAIDS
const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const ArrayUtils = require('../../common/utils/array-utils');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const { JSONLD_VALUE } = require('../../../../public/js/utils/databus-uris');

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

function autofillFileIdentifiers(datasetUri, fileGraph) {
  var contentVariants = [];
  var artifactUri = UriUtils.navigateUp(datasetUri, 1);
  var baseUri = UriUtils.navigateUp(datasetUri, 0);
  var artifactName = UriUtils.uriToName(artifactUri);

  for(var property in fileGraph) {
    if(property.startsWith(DatabusUris.DATAID_CONTENT_VARIANT_PREFIX)) {
      contentVariants.push({ key: property, value: fileGraph[property][0][DatabusUris.JSONLD_VALUE] });      
    }
  }

  var segment = artifactName;
  for(var cv of contentVariants) {
    var facet = UriUtils.uriToName(cv.key);
    var value = cv.value;
    segment += `_${facet}=${value}`;
  }

  var format = undefined;
  var compression = undefined;
  
  if(fileGraph[DatabusUris.DATAID_FORMAT_EXTENSION] != undefined) {
    format = fileGraph[DatabusUris.DATAID_FORMAT_EXTENSION][0][DatabusUris.JSONLD_VALUE];
  }

  if(fileGraph[DatabusUris.DATAID_COMPRESSION] != undefined) {
    compression = fileGraph[DatabusUris.DATAID_COMPRESSION][0][DatabusUris.JSONLD_VALUE];
  }

  if(format != undefined && format != 'none' && format != '') {
    segment += `.${format}`;
  }

  if(compression != undefined && compression != 'none' && compression != '') {
    segment += `.${compression}`;
  }

  fileGraph[DatabusUris.DATAID_FILE] = [];
  fileGraph[DatabusUris.DATAID_FILE].push({ '@id' : `${baseUri}/${segment}`});
  fileGraph[DatabusUris.JSONLD_ID] = `${baseUri}#${segment}`;
}

autocompleter.autocomplete = function (expandedGraph, logger) {


  var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);
  var datasetUri = datasetGraph[DatabusUris.JSONLD_ID];

  // check path length (has to be four)
  // if (UriUtils.getResourcePathLength(datasetUri) != 4) {
  //  if(debug) {
  //    notify(`Cancelled due to pathlength of ${datasetUri} being ${UriUtils.getResourcePathLength(datasetUri)}`);
  //  }
  //  
  //  return;
  // }

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

  if (datasetGraph[DatabusUris.DCT_ABSTRACT] == undefined 
    && datasetGraph[DatabusUris.DCT_DESCRIPTION] != undefined ) {

    var description = datasetGraph[DatabusUris.DCT_DESCRIPTION][0][DatabusUris.JSONLD_VALUE];
    datasetGraph[DatabusUris.DCT_ABSTRACT] = [{}];
    datasetGraph[DatabusUris.DCT_ABSTRACT][0][JSONLD_VALUE] = 
      DatabusUtils.createAbstractFromDescription(description);
  }

  datasetGraph[DatabusUris.DCT_MODIFIED] = [{}];
  datasetGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
  datasetGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_VALUE] = timeString;

  // Auto-generate resource entries
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_VERSION, 0);
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_ARTIFACT, 1);
  autocompleteResourceEntry(expandedGraph, DatabusUris.DATAID_GROUP, 2);

  var fileGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_PART);

  var contentVariantProperties = [];

  // Auto-complete versions
  for (var fileGraph of fileGraphs) {
    if (fileGraph[DatabusUris.DCT_HAS_VERSION] == undefined) {
      fileGraph[DatabusUris.DCT_HAS_VERSION] = datasetGraph[DatabusUris.DCT_HAS_VERSION];
    }

    if (fileGraph[DatabusUris.DCT_ISSUED] == undefined) {
      fileGraph[DatabusUris.DCT_ISSUED] = [{}];
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
      fileGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;
    }

    fileGraph[DatabusUris.DCT_MODIFIED] = [{}];
    fileGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
    fileGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_VALUE] = timeString;

    autofillFileIdentifiers(datasetUri, fileGraph);

    for (var propertyUri in fileGraph) {
      if (propertyUri.startsWith(DatabusUris.DATAID_CONTENT_VARIANT_PREFIX)) {
        contentVariantProperties.push(propertyUri);
      }
    }
  }

  // Auto-complete content variants
  contentVariantProperties = ArrayUtils.uniqueList(contentVariantProperties);

  for (var contentVariantProperty of contentVariantProperties) {

    var propertyGraph = JsonldUtils.getGraphById(expandedGraph, contentVariantProperty);

    if (propertyGraph != undefined) {
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

  datasetGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

  for (var fileGraph of fileGraphs) {

    datasetGraph[DatabusUris.DCAT_DISTRIBUTION].push({
      '@id' : fileGraph[DatabusUris.JSONLD_ID]
    });

    for (var contentVariantProperty of contentVariantProperties) {

      if (fileGraph[contentVariantProperty] == undefined) {
        fileGraph[contentVariantProperty] = [{}];
        fileGraph[contentVariantProperty][0][DatabusUris.JSONLD_VALUE] = "";
      }
    }
  }
}


autocompleter.autocompleteArtifact = function (expandedGraphs) {

  var artifactGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_ARTIFACT);
  var artifactUri = artifactGraph[DatabusUris.JSONLD_ID];
  var groupUri = UriUtils.navigateUp(artifactUri, 1);
  
  expandedGraphs.push({ '@id': groupUri, '@type': DatabusUris.DATAID_GROUP });

  if (artifactGraph[DatabusUris.DCT_TITLE] == undefined) {
    artifactGraph[DatabusUris.DCT_TITLE] = [{}];
    artifactGraph[DatabusUris.DCT_TITLE][0][JSONLD_VALUE] = UriUtils.uriToLabel(artifactUri);
  }

  if (artifactGraph[DatabusUris.DCT_ABSTRACT] == undefined 
    && artifactGraph[DatabusUris.DCT_DESCRIPTION] != undefined ) {

    var description = artifactGraph[DatabusUris.DCT_DESCRIPTION][0][DatabusUris.JSONLD_VALUE];
    artifactGraph[DatabusUris.DCT_ABSTRACT] = [{}];
    artifactGraph[DatabusUris.DCT_ABSTRACT][0][JSONLD_VALUE] = 
      DatabusUtils.createAbstractFromDescription(description);
  }
}

autocompleter.autocompleteGroup = function (expandedGraphs) {

  var groupGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_GROUP);
  var groupUri = groupGraph[DatabusUris.JSONLD_ID];

  if (groupGraph[DatabusUris.DCT_TITLE] == undefined) {
    groupGraph[DatabusUris.DCT_TITLE] = [{}];
    groupGraph[DatabusUris.DCT_TITLE][0][JSONLD_VALUE] = UriUtils.uriToLabel(groupUri);
  }

  if (groupGraph[DatabusUris.DCT_ABSTRACT] == undefined 
    && groupGraph[DatabusUris.DCT_DESCRIPTION] != undefined ) {

    var description = groupGraph[DatabusUris.DCT_DESCRIPTION][0][DatabusUris.JSONLD_VALUE];
    groupGraph[DatabusUris.DCT_ABSTRACT] = [{}];
    groupGraph[DatabusUris.DCT_ABSTRACT][0][JSONLD_VALUE] = 
      DatabusUtils.createAbstractFromDescription(description);
  }
}

module.exports = autocompleter;