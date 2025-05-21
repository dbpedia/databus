const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const UriUtils = require('../../common/utils/uri-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');
const Constants = require('../../common/constants.js');

var signer = require('./databus-tractate-suite.js');
var shaclTester = require('../../common/shacl-tester.js');
var GstoreHelper = require('../../common/utils/gstore-helper.js');
var jsonld = require('jsonld');
var sparql = require('../../common/queries/sparql.js');
var constructor = require('../../common/execute-construct.js');
var constructVersionQuery = require('../../common/queries/constructs/construct-version.sparql');
var autocompleter = require('./dataid-autocomplete.js');
var fileAnalyzer = require('../../common/file-analyzer.js');
const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const DatabusMessage = require('../../common/databus-message.js');


async function verifyDataidParts(dataidGraphs, alwaysFetch, logger) {

  var versionGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATABUS_VERSION);
  var versionGraphUri = versionGraph[DatabusUris.JSONLD_ID];
  var distributions = JsonldUtils.getTypedGraphs(dataidGraphs, DatabusUris.DATABUS_PART);

  for (var distribution of distributions) {
    // Only fetch when there is something missing!
    if (!alwaysFetch) {
      var needsFetching = false;

      needsFetching |= distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] == null;
      needsFetching |= distribution[DatabusUris.DATABUS_COMPRESSION] == null;
      needsFetching |= distribution[DatabusUris.DATABUS_SHASUM] == null;
      needsFetching |= distribution[DatabusUris.DCAT_BYTESIZE] == null;

      if (!needsFetching) {
        logger.debug(versionGraphUri, `File properties for part <${distribution[DatabusUris.JSONLD_ID]}> are already specified.`, distribution);
        continue;
      }
    }

    var downloadURL = distribution[DatabusUris.DCAT_DOWNLOAD_URL][0][DatabusUris.JSONLD_ID];
    var analyzeResult = await fileAnalyzer.analyzeFile(downloadURL);

    if (analyzeResult.code != 200) {
      logger.error(versionGraphUri, `Error analyzing file`, analyzeResult.data);
      return false;
    }

    logger.debug(versionGraphUri, `Analyzed part <${distribution[DatabusUris.JSONLD_ID]}>`, analyzeResult.data);


    if (distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] == undefined) {
      distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] = [{}];
      distribution[DatabusUris.DATABUS_FORMAT_EXTENSION][0][DatabusUris.JSONLD_VALUE]
        = analyzeResult.data.formatExtension;
    }

    if (distribution[DatabusUris.DATABUS_COMPRESSION] == undefined) {
      distribution[DatabusUris.DATABUS_COMPRESSION] = [{}];
      distribution[DatabusUris.DATABUS_COMPRESSION][0][DatabusUris.JSONLD_VALUE]
        = analyzeResult.data.compression;
    }

    distribution[DatabusUris.DATABUS_SHASUM] = [{}];
    distribution[DatabusUris.DATABUS_SHASUM][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.shasum;
    distribution[DatabusUris.DCAT_BYTESIZE] = [{}];
    distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.byteSize;
    distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
  }

  logger.debug(versionGraphUri, `All parts verified`, dataidGraphs);
  return true;
}

/**
 * Convert the expanded input graph into a curated graph using a construct query
 * @param {*} expandedGraph 
 * @param {*} log 
 */
async function constructInput(expandedGraph, versionGraphUri, logger) {

  try {
    var versionGraph = JsonldUtils.getGraphById(expandedGraph, versionGraphUri);
    var cvGraphs = JsonldUtils.getSubPropertyGraphs(expandedGraph, DatabusUris.DATABUS_CONTENT_VARIANT);
    logger.debug(versionGraphUri, `Detected CV-graphs`, cvGraphs);

    var distributionUris = versionGraph[DatabusUris.DCAT_DISTRIBUTION];

    var dataIdGraphs = [];
    dataIdGraphs.push(JSON.parse(JSON.stringify(versionGraph)));
    versionGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

    var totalTripleCount = 0;
    var step = 100;

    var versionGraphCopy = JSON.parse(JSON.stringify(versionGraph));
    var distributionlessGraphs = [versionGraphCopy].concat(cvGraphs);

    // Create sub-dataids with only 100 parts at a time
    // This will avoid long running or failing construct queries for large inputs
    for (var i = 0; i < distributionUris.length; i += step) {

      var distributionSubset = distributionUris.slice(i, Math.min(distributionUris.length, i + step))
      var slice = Array.from(distributionlessGraphs);

      // Add links from Dataset graph to each entry in the subset
      versionGraphCopy[DatabusUris.DCAT_DISTRIBUTION] = [];
      for (var j = 0; j < distributionSubset.length; j++) {
        versionGraphCopy[DatabusUris.DCAT_DISTRIBUTION].push(distributionSubset[j]);
        slice.push(JsonldUtils.getGraphById(expandedGraph, distributionSubset[j][DatabusUris.JSONLD_ID]));
      }

      var triples = await constructor.executeConstruct(slice, constructVersionQuery);
      var tripleCount = DatabusUtils.lineCount(triples);
      logger.debug(versionGraphUri, `Construct fetched ${tripleCount} triples from subgraph`);

      totalTripleCount += tripleCount;

      var unflattenedJsonLd = await jsonld.fromRDF(triples);

      var subGraphs = await jsonld.flatten(unflattenedJsonLd);
      subGraphs = JsonldUtils.getTypedGraphs(subGraphs, DatabusUris.DATABUS_PART);

      // Add the constructed graphs to the result graph
      for (var subGraph of subGraphs) {
        dataIdGraphs.push(subGraph);
        var distributionGraphEntry = {};
        distributionGraphEntry[DatabusUris.JSONLD_ID] = subGraph[DatabusUris.JSONLD_ID];
        versionGraph[DatabusUris.DCAT_DISTRIBUTION].push(distributionGraphEntry);
      }
    }

    if (totalTripleCount == 0) {
      return null;
    }

    logger.debug(versionGraphUri, `${tripleCount} triples selected via construct query.`, dataIdGraphs);
    return dataIdGraphs;
  } catch(err) {
    throw Error(err);
  }
}

function validateDatasetUri(dataidGraphs, accounts, logger) {

  var versionGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATABUS_VERSION);
  var versionGraphUri = versionGraph[DatabusUris.JSONLD_ID];

  // Validate the prefix of the Dataset identifier
  if (!versionGraphUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
    logger.error(versionGraphUri, `${versionGraphUri} does not start with the databus base URL ${process.env.DATABUS_RESOURCE_BASE_URL}`, null);
    return 400;
  }

  var versionGraphPath = UriUtils.cleanSegment(versionGraphUri.replace(process.env.DATABUS_RESOURCE_BASE_URL, ""));

  if (UriUtils.getPathLength(versionGraphPath) != 4) {
    logger.error(versionGraphUri, `Dataset uri <${versionGraphUri}> must have exactly 4 path segments relative to the Databus base url <${process.env.DATABUS_RESOURCE_BASE_URL}> (found ${UriUtils.getPathLength(versionGraphPath)})`, null);
    return 400;
  }

  if (!versionGraphUri.startsWith(accountUri)) {
    logger.error(versionGraphUri, `Dataset uri <${versionGraphUri}> does not start with the account URL <${accountUri}> of the issuer account.`, null);
    return 403;
  }


  return 200;
}

async function createOrValidateSignature(dataidGraphs, accountUri, logger) {

  // dataidGraphs = await jsonld.flatten(dataidGraphs);
  // Fetch important uris
  var versionGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATABUS_VERSION);
  var versionGraphUri = versionGraph[DatabusUris.JSONLD_ID];

  var datasetPublisherUri = JsonldUtils.getFirstObjectUri(versionGraph, DatabusUris.DCT_PUBLISHER);
  logger.debug(versionGraphUri, `Publishing as <${datasetPublisherUri}>.`, null);

  // Validate the publisher and account (<publisherUri<foaf:account<accountUri>)
  var isPublisherConnectedToAccount = await sparql.accounts
    .getPublisherHasAccount(datasetPublisherUri, accountUri);

  if (!isPublisherConnectedToAccount) {
    logger.error(versionGraphUri, `The specified publisher <${datasetPublisherUri}> is not linked to the account of the request issuer <${accountUri}>.`, null);
    return 403;
  }

  // Fetch the proof graph
  var proofId = JsonldUtils.getFirstObjectUri(versionGraph, DatabusUris.SEC_PROOF);
  var proofGraph = JsonldUtils.getGraphById(dataidGraphs, proofId);
  var generatingSignature = false;

  // Not setting the proof is allowed!
  if (proofGraph == undefined) {

    // No proof yet, try to create one
    logger.debug(versionGraphUri, `No signature found in the input.`, null);

    // Verify if this account is an internal one
    if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
      logger.error(versionGraphUri, `Uploads using an external account need to provide a signature.`, null);
      return 400;
    }

    logger.debug(versionGraphUri, `Generating signature.`, null);
    generatingSignature = true;
    proofGraph = signer.createProof(dataidGraphs);

    versionGraph[DatabusUris.SEC_PROOF] = [proofGraph];

    dataidGraphs = await jsonld.flatten(dataidGraphs);
  }

  // Get the type of the proof graph
  var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

  // Validate the used proof type
  if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {
    logger.error(versionGraphUri, `Unkown proof type <${proofType}>.`, proofType);
    return 400;
  }

  //console.log(proofGraph);
  // Validate the proof 
  //console.log(dataidGraphs);

  var validationSuccess = await signer.validate(signer.canonicalize(dataidGraphs), proofGraph);

  if (!validationSuccess) {

    if (generatingSignature) {
      logger.error(versionGraphUri, `Failed to generate signature. Please contact an administrator.`, null);
      return 500;
    } else {
      logger.error(versionGraphUri, `The provided signature was invalid.`, null);
      return 400;
    }
  }

  return 200;
}

module.exports = async function publishVersion(accounts, expandedGraph, versionGraphUri, fetchFileProperties, logger) {

  try {

    var versionGraph = JsonldUtils.getGraphById(expandedGraph, versionGraphUri);
    logger.debug(versionGraphUri, `Processing version <${versionGraphUri}>`, versionGraph);

    // Run SHACL validation
    var shaclResult = await shaclTester.validateVersionInputRDF(expandedGraph);

    console.log(shaclResult);
    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      logger.error(versionGraphUri, `Input validation failed`, shaclResult);
      return 400;
    }

    // Run construct query
    var dataidGraphs = await constructInput(expandedGraph, versionGraphUri, logger);
    versionGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATABUS_VERSION);

    if (dataidGraphs == null) {
      logger.debug(versionGraphUri, `Construct query did not yield any triples. Nothing to publish.`, null);
      return 200;
    }

    // Validate Dataset Uri
    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
    var validationCode = validateDatasetUri(dataidGraphs, accountUri, logger);

    if (validationCode != 200) {
      return validationCode;
    }

    // Run auto-completion
    logger.debug(versionGraphUri, `Input before auto-completion`, dataidGraphs);
    autocompleter.autocomplete(dataidGraphs, logger);
    logger.debug(versionGraphUri, `Input after auto-completion`, dataidGraphs);

    logger.debug(versionGraphUri, `fetch-file-properties is set to ${fetchFileProperties}`, null);

    // Verify parts: SHA256SUM, BYTESIZE, etc
    if (fetchFileProperties == true || fetchFileProperties == null) {

      if (!(await verifyDataidParts(dataidGraphs, fetchFileProperties == true, logger))) {
        return 400;
      }
    }

    // Run CV validator to validate content variant setup
    var distributionGraphs = JsonldUtils.getTypedGraphs(dataidGraphs, DatabusUris.DATABUS_PART);
    var cvGraphs = JsonldUtils.getSubPropertyGraphs(dataidGraphs, DatabusUris.DATABUS_CONTENT_VARIANT);

    // Apply data fix for byteSize, so omitting DECIMAL passes the SHACL test
    for (var distribution of distributionGraphs) {
      if (distribution[DatabusUris.DCAT_BYTESIZE] != null && distribution[DatabusUris.DCAT_BYTESIZE].length > 0) {
        distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
      }
    }

    var contentVariantUris = [];

    contentVariantUris.push(DatabusUris.DATABUS_FORMAT_EXTENSION);
    contentVariantUris.push(DatabusUris.DATABUS_COMPRESSION);

    for (var cvGraph of cvGraphs) {
      contentVariantUris.push(cvGraph[DatabusUris.JSONLD_ID]);
    }

    var contentVariantErrors = DatabusUtils.cvSplit(distributionGraphs, contentVariantUris, 0);

    if (contentVariantErrors.length > 0) {
      logger.error(versionGraphUri, `Invalid content variant setup. Two or more files are not distinguishable by either databus:formatExtension, databus:compression or any custom content variant.`, contentVariantErrors);
      return 400;
    }

    logger.debug(versionGraphUri, `SHACL validation successful`, shaclResult);
    dataidGraphs = await jsonld.flatten(dataidGraphs);
    validationCode = await createOrValidateSignature(dataidGraphs, accountUri, logger);

    if (validationCode != 200) {
      return validationCode;
    }

    logger.debug(versionGraphUri, `Signature validation successful.`, null);

    // Run SHACL validation
    var shaclResult = await shaclTester.validateVersionRDF(dataidGraphs);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      logger.error(versionGraphUri, `SHACL validation failed`, shaclResult);
      return 400;
    }

    // Create compacted graph
    var compactedGraph = await jsonld.compact(dataidGraphs, process.env.DATABUS_CONTEXT_URL);
    //  logger.debug(versionGraphUri, `Context has been resubstituted with <${process.env.DATABUS_CONTEXT_URL}>`);

    //if (process.env.DATABUS_CONTEXT_URL != null) {
    //  compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
    //}

    // Create the target path for the gstore
    var targetPath = UriUtils.getPrunedPath(`${versionGraphUri}/${Constants.DATABUS_FILE_DATAID}`);
    logger.debug(versionGraphUri, `Saving dataset to ${accountName}:${targetPath}`, compactedGraph);

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      var statusCode = publishResult.statusCode;
      delete publishResult.statusCode;
      logger.error(versionGraphUri, `Failed to save version to database.`, publishResult);
      return statusCode;
    }

    if (process.send != undefined) {
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
        resource: versionGraphUri
      });
    }

    logger.info(versionGraphUri, `Successfully published version <${versionGraphUri}>.`, compactedGraph);
    return 200;

  } catch (err) {
    console.log(`Unexpected Databus error when processing dataid data`);
    console.log(err);
    logger.error(null, `Unexpected Databus error when processing dataid data`, null);
    console.log(err);
    return 500;
  }
}
