// MODULE COMPLETES INPUT DATAIDS
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const ArrayUtils = require('../../common/utils/array-utils');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const { JSONLD_VALUE } = require('../../../../public/js/utils/databus-uris');
const knownCompressionExtensions = require('../../common/config/compression-extensions.json');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');

var autocompleter = {};

function autofillFileIdentifiers(datasetUri, fileGraph) {
  var contentVariants = [];
  var artifactUri = UriUtils.navigateUp(datasetUri, 1);
  var baseUri = UriUtils.navigateUp(datasetUri, 0);
  var artifactName = UriUtils.uriToName(artifactUri);

  for (var property in fileGraph) {
    if (property.startsWith(DatabusUris.DATABUS_CONTENT_VARIANT_PREFIX)) {
      contentVariants.push({ key: property, value: fileGraph[property][0][DatabusUris.JSONLD_VALUE] });
    }
  }

  var segment = artifactName;
  for (var cv of contentVariants) {
    var facet = UriUtils.uriToName(cv.key);
    var value = cv.value;
    segment += `_${facet}=${value}`;
  }

  var format = undefined;
  var compression = undefined;

  if (fileGraph[DatabusUris.DATABUS_FORMAT_EXTENSION] != undefined) {
    format = fileGraph[DatabusUris.DATABUS_FORMAT_EXTENSION][0][DatabusUris.JSONLD_VALUE];
  }

  if (fileGraph[DatabusUris.DATABUS_COMPRESSION] != undefined) {
    compression = fileGraph[DatabusUris.DATABUS_COMPRESSION][0][DatabusUris.JSONLD_VALUE];
  }

  if (format != undefined && format != 'none' && format != '') {
    segment += `.${format}`;
  }

  if (compression != undefined && compression != 'none' && compression != '') {

    if(knownCompressionExtensions[compression] != undefined) {
      compression = knownCompressionExtensions[compression]
    }

    segment += `.${compression}`;
  }

  fileGraph[DatabusUris.DATABUS_FILE] = [{}];
  fileGraph[DatabusUris.DATABUS_FILE][0][DatabusUris.JSONLD_ID] = `${baseUri}/${segment}`;
  fileGraph[DatabusUris.JSONLD_ID] = `${baseUri}#${segment}`;
}

autocompleter.autocomplete = function (expandedGraph, logger) {

  var versionGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATABUS_VERSION);

  if (versionGraph == null) {
    return expandedGraph;
  }

  var datasetUri = versionGraph[DatabusUris.JSONLD_ID];
  var artifactUri = DatabusUtils.navigateUp(datasetUri, 1);
  var groupUri = DatabusUtils.navigateUp(datasetUri, 2);
  var accountUri = DatabusUtils.navigateUp(datasetUri, 3);

  versionGraph[DatabusUris.JSONLD_TYPE] = [ DatabusUris.DATABUS_VERSION ];

  versionGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = [{}];
  versionGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY][0][DatabusUris.JSONLD_ID] = accountUri;

  versionGraph[DatabusUris.DATABUS_GROUP_PROPERTY] = [{}];
  versionGraph[DatabusUris.DATABUS_GROUP_PROPERTY][0][DatabusUris.JSONLD_ID] = groupUri;

  versionGraph[DatabusUris.DATABUS_ARTIFACT_PROPERTY] = [{}];
  versionGraph[DatabusUris.DATABUS_ARTIFACT_PROPERTY][0][DatabusUris.JSONLD_ID] = artifactUri;

  // Auto-generate publisher entry
  var publisherUri = JsonldUtils.getFirstObjectUri(versionGraph, DatabusUris.DCT_PUBLISHER);

  if (publisherUri == null) {
    versionGraph[DatabusUris.DCT_PUBLISHER] = [{}];
    versionGraph[DatabusUris.DCT_PUBLISHER][0][DatabusUris.JSONLD_ID] = `${accountUri}${DatabusConstants.WEBID_THIS}`;
  }

  var timeString = DatabusUtils.timeStringNow();

  if (versionGraph[DatabusUris.DCT_ISSUED] == undefined) {
    versionGraph[DatabusUris.DCT_ISSUED] = [{}];
    versionGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
    versionGraph[DatabusUris.DCT_ISSUED][0][DatabusUris.JSONLD_VALUE] = timeString;
  }

  if (versionGraph[DatabusUris.DCT_ABSTRACT] == undefined
    && versionGraph[DatabusUris.DCT_DESCRIPTION] != undefined) {

    var description = versionGraph[DatabusUris.DCT_DESCRIPTION][0][DatabusUris.JSONLD_VALUE];
    versionGraph[DatabusUris.DCT_ABSTRACT] = [{}];
    versionGraph[DatabusUris.DCT_ABSTRACT][0][JSONLD_VALUE] =
      DatabusUtils.createAbstractFromDescription(description);
  }
  
  var versionName = UriUtils.uriToName(datasetUri);
  versionGraph[DatabusUris.DATABUS_NAME] = [{}];
  versionGraph[DatabusUris.DATABUS_NAME][0][DatabusUris.JSONLD_VALUE] =versionName;

  if (versionGraph[DatabusUris.DCT_HAS_VERSION] == undefined) {
    versionGraph[DatabusUris.DCT_HAS_VERSION] = [{}];
    versionGraph[DatabusUris.DCT_HAS_VERSION][0][DatabusUris.JSONLD_VALUE] = versionName;
  }

  versionGraph[DatabusUris.DCT_MODIFIED] = [{}];
  versionGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
  versionGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_VALUE] = timeString;

  // Auto-generate resource entries

  var artifactGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATABUS_ARTIFACT);
 
  if (artifactGraph == undefined) {
    artifactGraph = {};
    artifactGraph[DatabusUris.JSONLD_ID] = artifactUri;
    artifactGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_ARTIFACT;
    expandedGraph.push(artifactGraph);
  }

  artifactGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = [{}];
  artifactGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY][0][DatabusUris.JSONLD_ID] = accountUri;
  artifactGraph[DatabusUris.DATABUS_GROUP_PROPERTY] = [{}];
  artifactGraph[DatabusUris.DATABUS_GROUP_PROPERTY][0][DatabusUris.JSONLD_ID] = groupUri;


  var groupGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATABUS_GROUP);
 
  if (groupGraph == undefined) {
    groupGraph = {};
    groupGraph[DatabusUris.JSONLD_ID] = groupUri;
    groupGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_GROUP;
    expandedGraph.push(groupGraph);
  }

  groupGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = [{}];
  groupGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY][0][DatabusUris.JSONLD_ID] = accountUri;

  var fileGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATABUS_PART);

  var contentVariantProperties = [];

  // Auto-complete versions
  for (var fileGraph of fileGraphs) {
    if (fileGraph[DatabusUris.DCT_HAS_VERSION] == undefined) {
      fileGraph[DatabusUris.DCT_HAS_VERSION] = versionGraph[DatabusUris.DCT_HAS_VERSION];
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
      if (propertyUri.startsWith(DatabusUris.DATABUS_CONTENT_VARIANT_PREFIX)) {
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
      = DatabusUris.DATABUS_CONTENT_VARIANT;
    expandedGraph.push(propertyGraph);
  }

  versionGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

  for (var fileGraph of fileGraphs) {

    var distributionReference = {};
    distributionReference[DatabusUris.JSONLD_ID] = fileGraph[DatabusUris.JSONLD_ID];

    versionGraph[DatabusUris.DCAT_DISTRIBUTION].push(distributionReference);

    for (var contentVariantProperty of contentVariantProperties) {

      if (fileGraph[contentVariantProperty] == undefined) {
        fileGraph[contentVariantProperty] = [{}];
        fileGraph[contentVariantProperty][0][DatabusUris.JSONLD_VALUE] = "";
      }
    }
  }

  return expandedGraph;
}



module.exports = autocompleter;