const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');
const fs = require('fs');

var signer = require('./databus-tractate-suite');
var shaclTester = require('../../common/shacl/shacl-tester');
var GstoreHelper = require('../../common/utils/gstore-helper');
var jsonld = require('jsonld');
var sparql = require('../../common/queries/sparql');
var defaultContext = require('../../../../model/generated/context.json');
var constructor = require('../../common/execute-construct.js');
var constructVersionQuery = require('../../common/queries/constructs/construct-version.sparql');
var autocompleter = require('./dataid-autocomplete');
var fileAnalyzer = require('../../common/file-analyzer');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusLogLevel = require('../../common/databus-log-level');


async function verifyDataidParts(dataidGraphs, logger) {

  var datasetGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATAID_DATASET);
  var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];
  var distributions = JsonldUtils.getTypedGraphs(dataidGraphs, DatabusUris.DATAID_PART);

  for (var distribution of distributions) {

    logger.debug(datasetGraphUri, `Analyzing part <${distribution[DatabusUris.JSONLD_ID]}>`, null);
    var downloadURL = distribution[DatabusUris.DCAT_DOWNLOAD_URL][0][DatabusUris.JSONLD_ID];

    var analyzeResult = await fileAnalyzer.analyzeFile(downloadURL);

    if (analyzeResult.code != 200) {
      logger.error(datasetGraphUri, `Error analyzing file`, analyzeResult.data);
      return false;
    }

    distribution[DatabusUris.DATAID_SHASUM] = [{}];
    distribution[DatabusUris.DATAID_SHASUM][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.shasum;
    distribution[DatabusUris.DCAT_BYTESIZE] = [{}];
    distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.byteSize;
    distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
  }

  logger.debug(datasetGraphUri, `All parts verified`, dataidGraphs);
  return true;
}

/**
 * Convert the expanded input graph into a curated graph using a construct query
 * @param {*} expandedGraph 
 * @param {*} log 
 */
async function constructInput(expandedGraph, datasetGraphUri, logger) {

  var datasetGraph = JsonldUtils.getGraphById(expandedGraph, datasetGraphUri);
  var cvGraphs = JsonldUtils.getSubPropertyGraphs(expandedGraph, DatabusUris.DATAID_CONTENT_VARIANT);
  logger.debug(datasetGraphUri, `Detected CV-graphs`, cvGraphs);

  var distributionUris = datasetGraph[DatabusUris.DCAT_DISTRIBUTION];

  var dataIdGraphs = [];
  dataIdGraphs.push(JSON.parse(JSON.stringify(datasetGraph)));
  datasetGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

  var totalTripleCount = 0;
  var step = 100;

  var datasetGraphCopy = JSON.parse(JSON.stringify(datasetGraph));
  var distributionlessGraphs = [datasetGraphCopy].concat(cvGraphs);

  // Create sub-dataids with only 100 parts at a time
  // This will avoid long running or failing construct queries for large inputs
  for (var i = 0; i < distributionUris.length; i += step) {

    var distributionSubset = distributionUris.slice(i, Math.min(distributionUris.length, i + step))
    var slice = Array.from(distributionlessGraphs);

    // Add links from Dataset graph to each entry in the subset
    datasetGraphCopy[DatabusUris.DCAT_DISTRIBUTION] = [];
    for (var j = 0; j < distributionSubset.length; j++) {
      datasetGraphCopy[DatabusUris.DCAT_DISTRIBUTION].push(distributionSubset[j]);
      slice.push(JsonldUtils.getGraphById(expandedGraph, distributionSubset[j][DatabusUris.JSONLD_ID]));
    }

    var triples = await constructor.executeConstruct(slice, constructVersionQuery);
    var tripleCount = DatabusUtils.lineCount(triples);
    logger.debug(datasetGraphUri, `Construct fetched ${tripleCount} triples from subgraph`);

    totalTripleCount += tripleCount;

    var subGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));
    subGraphs = JsonldUtils.getTypedGraphs(subGraphs, DatabusUris.DATAID_PART);

    // Add the constructed graphs to the result graph
    for (var subGraph of subGraphs) {
      dataIdGraphs.push(subGraph);
      var distributionGraphEntry = {};
      distributionGraphEntry[DatabusUris.JSONLD_ID] = subGraph[DatabusUris.JSONLD_ID];
      datasetGraph[DatabusUris.DCAT_DISTRIBUTION].push(distributionGraphEntry);
    }
  }

  if (totalTripleCount == 0) {
    return null;
  }

  logger.debug(datasetGraphUri, `${tripleCount} triples selected via construct query.`, dataIdGraphs);
  return dataIdGraphs;
}

function validateDatasetUri(dataidGraphs, accountUri, logger) {

  var datasetGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATAID_DATASET);
  var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];

  // Validate the prefix of the Dataset identifier
  if (!datasetGraphUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
    logger.error(datasetGraphUri, `${datasetGraphUri} does not start with the databus base URL ${process.env.DATABUS_RESOURCE_BASE_URL}`, null);
    return 400;
  }

  var datasetGraphPath = UriUtils.cleanSegment(datasetGraphUri.replace(process.env.DATABUS_RESOURCE_BASE_URL, ""));

  if (UriUtils.getPathLength(datasetGraphPath) != 4) {
    logger.error(datasetGraphUri, `Dataset uri <${datasetGraphUri}> must have exactly 4 path segments relative to the Databus base url <${process.env.DATABUS_RESOURCE_BASE_URL}> (found ${UriUtils.getPathLength(datasetGraphPath)})`, null);
    return 400;
  }

  if (!datasetGraphUri.startsWith(accountUri)) {
    logger.error(datasetGraphUri, `Dataset uri <${datasetGraphUri}> does not start with the account URL <${accountUri}> of the issuer account.`, null);
    return 403;
  }


  return 200;
}

async function createOrValidateSignature(dataidGraphs, accountUri, logger) {
  // Fetch important uris
  var datasetGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATAID_DATASET);
  var datasetGraphUri = datasetGraph[DatabusUris.JSONLD_ID];

  var datasetPublisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DCT_PUBLISHER);
  logger.debug(datasetGraphUri, `Publishing as <${datasetPublisherUri}>.`, null);

  // Validate the publisher and account (<publisherUri<foaf:account<accountUri>)
  var isPublisherConnectedToAccount = await sparql.accounts
    .getPublisherHasAccount(datasetPublisherUri, accountUri);

  if (!isPublisherConnectedToAccount) {
    logger.error(datasetGraphUri, `The specified publisher <${datasetPublisherUri}> is not linked to the account of the request issuer.`, null);
    return 403;
  }

  // Fetch the proof graph
  var proofId = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.SEC_PROOF);
  var proofGraph = JsonldUtils.getGraphById(dataidGraphs, proofId);
  var generatingSignature = false;

  // Not setting the proof is allowed!
  if (proofGraph == undefined) {

    // No proof yet, try to create one
    logger.debug(datasetGraphUri, `No signature found in the input.`, null);

    // Verify if this account is an internal one
    if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
      logger.error(datasetGraphUri, `Uploads using an external account need to provide a signature.`, null);
      return 400;
    }

    logger.debug(datasetGraphUri, `Generating signature.`, null);
    generatingSignature = true;
    proofGraph = signer.createProof(dataidGraphs);
    datasetGraph[DatabusUris.SEC_PROOF] = [proofGraph];
    dataidGraphs = await jsonld.flatten(dataidGraphs);
  }

  // Get the type of the proof graph
  var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

  // Validate the used proof type
  if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {
    logger.erorr(datasetGraphUri, `Unkown proof type <${proofType}>.`, proofType);
    return 400;
  }

  // Validate the proof 
  var validationSuccess = await signer.validate(signer.canonicalize(dataidGraphs), proofGraph);

  if (!validationSuccess) {

    if (generatingSignature) {
      logger.erorr(datasetGraphUri, `Failed to generate signature. Please contact an administrator.`, null);
      return 500;
    } else {
      logger.erorr(datasetGraphUri, `The provided signature was invalid.`, null);
      return 400;
    }
  }

  return 200;
}

module.exports = async function publishDataid(accountName, expandedGraph, datasetGraphUri, verifyParts, logger) {

  try {

    var datasetGraph = JsonldUtils.getGraphById(expandedGraph, datasetGraphUri);
    logger.debug(datasetGraphUri, `Processing dataset <${datasetGraphUri}>`, datasetGraph);


    // Run construct query
    var dataidGraphs = await constructInput(expandedGraph, datasetGraphUri, logger);
    datasetGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATAID_DATASET);
  
    if (dataidGraphs == null) {
      logger.debug(datasetGraphUri, `Construct query did not yield any triples. Nothing to publish.`, null);
      return 200;
    }


    // Validate Dataset Uri
    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
    var validationCode = validateDatasetUri(dataidGraphs, accountUri, logger);

    if (validationCode != 200) {
      return validationCode;
    }

   

    // Run auto-completion
    logger.debug(datasetGraphUri, `Input before auto-completion`, dataidGraphs);
    autocompleter.autocomplete(dataidGraphs, logger);
    logger.debug(datasetGraphUri, `Input after auto-completion`, dataidGraphs);

    logger.debug(datasetGraphUri, `verify-parts is set to ${verifyParts}`, null);
     // Verify parts: SHA256SUM, BYTESIZE, etc
     if (verifyParts && !(await verifyDataidParts(dataidGraphs, logger))) {
      return 400;
    }

    // Run SHACL validation
    var shaclResult = await shaclTester.validateDataidRDF(dataidGraphs);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      logger.error(datasetGraphUri, `SHACL validation failed`, shaclResult);
      return 400;
    }

    logger.debug(datasetGraphUri, `SHACL validation successful`, shaclResult);
    validationCode = await createOrValidateSignature(dataidGraphs, accountUri, logger);

    if (validationCode != 200) {
      return validationCode;
    }

    logger.debug(datasetGraphUri, `Signature validation successful.`, null);

    // Create compacted graph
    var compactedGraph = await jsonld.compact(dataidGraphs, defaultContext);

    if (process.env.DATABUS_CONTEXT_URL != null) {
      compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      logger.debug(datasetGraphUri, `Context has been resubstituted with <${process.env.DATABUS_CONTEXT_URL}>`);
    }

    // Create the target path for the gstore
    var datasetVersionUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_VERSION_PROPERTY);
    var targetPath = UriUtils.getPrunedPath(`${datasetVersionUri}/${Constants.DATABUS_FILE_DATAID}`);
    logger.info(datasetGraphUri, `Saving dataset to ${accountName}:${targetPath}`, compactedGraph);

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      logger.error(datasetGraphUri, `Internal database error`, null);
      return 500;
    }

    return 200;

    /*
    var distributionGraphs = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_PART);
    var cvGraphs = JsonldUtils.getSubPropertyGraphs(expandedGraph, DatabusUris.DATAID_CONTENT_VARIANT);

    if (debug) {
      notify(`Detected CV-graphs, ${JSON.stringify(cvGraphs)}`);
    }

    var dataIdGraphs = [];
    dataIdGraphs.push(datasetGraph);

    datasetGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

    var tripleCount = 0;
    var step = 100;

    var datasetGraphCopy = JSON.parse(JSON.stringify(datasetGraph));
    var distributionlessGraphs = [datasetGraphCopy].concat(cvGraphs);

    // Create sub-dataids with only 100 parts at a time
    // This will avoid long running or failing construct queries for large inputs
    for (var i = 0; i < distributionGraphs.length; i += step) {

      var distributionSubset = distributionGraphs.slice(i, Math.min(distributionGraphs.length, i + step))

      datasetGraphCopy[DatabusUris.DCAT_DISTRIBUTION] = [];

      for (var j = 0; j < distributionSubset.length; j++) {
        datasetGraphCopy[DatabusUris.DCAT_DISTRIBUTION].push({
          '@id': distributionSubset[j][DatabusUris.JSONLD_ID]
        });
      }

      var slice = distributionlessGraphs.concat(distributionSubset);

      if (debug) {
        notify(`${slice}\n`);
      }
      var triples = await constructor.executeConstruct(slice, constructVersionQuery);
      tripleCount += DatabusUtils.lineCount(triples);

      if (debug) {
        notify(`CONSTRUCT SELECTED TRIPLES: \n\n${triples}\n`);
      }

      var subGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));
      subGraphs = JsonldUtils.getTypedGraphs(subGraphs, DatabusUris.DATAID_PART);

      for (var subGraph of subGraphs) {
        dataIdGraphs.push(subGraph);

        datasetGraph[DatabusUris.DCAT_DISTRIBUTION].push({
          '@id': subGraph[DatabusUris.JSONLD_ID]
        });
      }
    }

    // Create multiple datasets by removing distributions
    // Fetch only relevant triples from the input via construct query
    // var triples = await constructor.executeConstruct(data, constructVersionQuery);
    if (tripleCount == 0) {
      notify(`Construct query did not yield any triples. Nothing to publish.`);
      return { code: 100, message: null };
    }

    notify(`${tripleCount} triples selected via construct query.`);

   


    // console.log(JSON.stringify(dataIdGraphs, null, 3));

    // Validate the group RDF with the shacl validation tool of the gstore


    // Fetch important uris
    var datasetUri = datasetGraph['@id'];
    var datasetPublisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DCT_PUBLISHER);
    var datasetVersionUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_VERSION_PROPERTY);

    notify(`Publishing as "${datasetPublisherUri}".`);

    // Validate the publisher and account (<publisherUri<foaf:account<accountUri>)
    var isPublisherConnectedToAccount =
      await sparql.accounts.getPublisherHasAccount(datasetPublisherUri, accountUri);

    if (!isPublisherConnectedToAccount) {
      notify(`Forbidden: The specified publisher is not linked to the account of the request issuer.`)
      return { code: 403, message: null };
    }

    // Fetch the proof graph
    var proofId = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.SEC_PROOF);
    var proofGraph = JsonldUtils.getGraphById(dataIdGraphs, proofId);
    var generatingSignature = false;

    // Not setting the proof is allowed!
    if (proofGraph == undefined) {

      // No proof yet, try to create one
      notify(`No signature found in the input.`);

      // Verify if this account is an internal one
      if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        return { code: 400, message: 'Uploads using an external account need to provide a signature' };
      }

      notify(`Generating signature.`);
      generatingSignature = true;

      proofGraph = signer.createProof(dataIdGraphs);
      datasetGraph[DatabusUris.SEC_PROOF] = [proofGraph];
      dataIdGraphs = await jsonld.flatten(dataIdGraphs);

      console.log(proofGraph);
    }

    // Get the type of the proof graph
    var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

    // Validate the used proof type
    if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {

      notify(`Error: Unkown proof type "${proofType}"`);
      return { code: 400, message: null };
    }

    // Validate the proof 
    var validationSuccess = await signer.validate(signer.canonicalize(dataIdGraphs), proofGraph);

    if (!validationSuccess) {

      if (generatingSignature) {
        notify('Failed to generate signature. Please contact an administrator.');
        return { code: 500, message: null };
      } else {
        notify('The provided signature was invalid.');
        return { code: 400, message: null };
      }
    }

    notify(`Signature validation successful.`);

    // Create compacted graph
    var compactedGraph = await jsonld.compact(dataIdGraphs, defaultContext);

    // TODO enable this: 
    compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_DEFAULT_CONTEXT_URL;


    // Create the target path for the gstore
    var targetPath = UriUtils.getPrunedPath(`${datasetVersionUri}/${Constants.DATABUS_FILE_DATAID}`);

    notify(`Saving to "${datasetUri}"`);


    // if (!fs.existsSync(__dirname + '/debug-out')) {
    //  fs.mkdirSync(__dirname + '/debug-out');
    //}

    // fs.writeFileSync(`${__dirname}/debug-out/${targetPath.replaceAll('/', '-')}`, JSON.stringify(compactedGraph, null, 3), "utf8");

    // console.log(JSON.stringify(compactedGraph, null, 3));

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(account, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error' };
    }

    return { code: 200, message: 'Success.' };
     */

  } catch (err) {
    console.log(`Unexpected Databus error when processing dataid data`);
    console.log(err);
    logger.error(null, `Unexpected Databus error when processing dataid data`, null);
    console.log(err);
    return 500;
  }
}
