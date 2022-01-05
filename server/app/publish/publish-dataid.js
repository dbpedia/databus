const JsonldUtils = require('../common/utils/jsonld-utils');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../common/utils/databus-uris');


var signer = require('../tractate/databus-tractate-suite');
var shaclTester = require('../common/shacl/shacl-tester');
var databaseManager = require('../common/remote-database-manager');
var jsonld = require('jsonld');
var sparql = require('../common/queries/sparql');
var defaultContext = require('../../../context.json');
var constructor = require('../common/execute-construct.js');
var constructVersionQuery = require('../common/queries/constructs/construct-version.sparql');
const Constants = require('../common/constants');
const dataidFileName = 'dataid.jsonld';
const autocompleter = require('../common/dataid-autocomplete');


function autocompleteResourceUri(expandedGraph, prop, navUpAmount) {
  var uri = JsonldUtils.getFirstObjectUri(expandedGraph, prop);
  if(uri == null) {
    expandedGraph[prop] = { '@id' : UriUtils.navigateUp(datasetGraph['@id'], navUpAmount) };
  }
}


module.exports = async function publishDataid(account, data, notify) {

  try {

    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account}`;
    var report = '';

    var expandedGraph = await jsonld.flatten(data);
    var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);
    notify(`Publishing dataset ${datasetGraph["@id"]}.\n`);

    var triples = await constructor.executeConstruct(data, constructVersionQuery);

    if(triples.length == 0) {
      return;
    }

    notify(`> Triples selected via construct query.\n`);

    //console.log(triples);
    expandedGraph = await jsonld.flatten(await jsonld.fromRDF(triples));
    datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);


    var before = JSON.stringify(expandedGraph);
    autocompleter.autocomplete(expandedGraph, accountUri);    
    var after = JSON.stringify(expandedGraph);

    if(before != after) {
      notify(`> Auto-completed the input.\n`);
    }
    // Generate dynamic shacl test ?

    // Validate the group RDF with the shacl validation tool

    
    var shaclResult = await shaclTester.validateDataidRDF(expandedGraph);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      var response = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        response += `> ${shaclResult.messages[m]}\n`
      }

      return { code: 400, message: response };
    }

    notify(`> SHACL validation successful.\n`);

    // Validate all identifiers...
    var datasetUri = datasetGraph['@id'];

    var datasetPublisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DCT_PUBLISHER);
    var datasetGroupUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_GROUP_PROPERTY);
    var datasetArtifactUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_ARTIFACT_PROPERTY);
    var datasetVersionUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_VERSION_PROPERTY);

    // Prefix checks
    

    var expectedDatasetUri = `${datasetVersionUri}#Dataset`;

    if(datasetUri != expectedDatasetUri) {
      return {
        code: 400, message:
          `The specified dataset identifier does not match the expected identifier.\n
          (Specified: ${datasetUri}, expected: ${expectedDatasetUri})\n`
      };      
    }

    // Validate Group URI

    var expectedGroupUri = UriUtils.navigateUp(datasetUri, 2);

    if (datasetGroupUri != expectedGroupUri) {

      return {
        code: 400, message:
          `The specified dataset group identifier does not match the expected identifier.\n
          (Specified: ${datasetGroupUri}, expected: ${expectedGroupUri})\n`
      };
    }

    var expectedAccountUri = UriUtils.navigateUp(datasetUri, 3);

    if (expectedAccountUri != accountUri) {

      return {
        code: 400, message:
          `The specified account does not match the expected account.\n
          (Specified: ${expectedAccountUri}, expected: ${accountUri})\n`
      };
    }

    // Check if group exists
    var group = await sparql.dataid.getGroupByUri(datasetGroupUri);

    if (group == undefined) {
      return {
        code: 400, message:
        `The specified group '${datasetGroupUri}' does not exist\n`
      };
    }

    // Validate Artifact URIs
    var expectedArtifactUri = UriUtils.navigateUp(datasetUri, 1);
    if (datasetArtifactUri != expectedArtifactUri) {
      return {
        code: 400, message:
          `The specified dataset artifact identifier (dataid:Dataset) does not match the expected identifier. \n
          (Specified: ${datasetArtifactUri}, expected: ${expectedArtifactUri})\n`
      };
    }

    // TODO: More validataion!


    
    notify(`> Publishing as ${datasetPublisherUri}.\n`);

    // Validate the publisher and account (<publisherUri> <foaf:account> <accountUri>)
    var isPublisherConnectedToAccount =
      await sparql.accounts.getPublisherHasAccount(datasetPublisherUri, accountUri);

    if (!isPublisherConnectedToAccount) {
      return { code: 400, message: 'The specified publisher is not associated with the requested account' };
    }

    var proofId = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.SEC_PROOF);
    var proofGraph = JsonldUtils.getGraphById(expandedGraph, proofId);

    console.log(proofGraph);

    // Not setting the proof is allowed!
    if (proofGraph == undefined) {

      // No proof yet, try to create one

      notify(`> No signature found.\n`);

      // Verify if this account is an internal one
      if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        return { code: 400, message: 'Uploads using an external account need to provide a signature' };
      }

      report += "-- Proof generated with internal key.\n";

      notify(`> Generating signature.\n`);
      console.log('Internal account detected. Generating proof...');
      proofGraph = signer.createProof(expandedGraph);
      datasetGraph[DatabusUris.PROOF] = [proofGraph];
    }

    // Get the type of the proof graph
    var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

    // console.log(`Proof found: ${proofType}`);
    if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {
      return { code: 400, message: `Unkown proof type "${proofType}"\n` };
    }

    // Validate
    var validationSuccess = await signer.validate(signer.canonicalize(expandedGraph), proofGraph);

    if (!validationSuccess) {
      return { code: 400, message: 'The provided signature is invalid\n' };
    }

    notify(`> Signature validation successful.\n`);

    // Create compacted graph
    var compactedGraph = await jsonld.compact(expandedGraph, defaultContext);

    var targetPath = `${datasetVersionUri}/${dataidFileName}`.replace(process.env.DATABUS_RESOURCE_BASE_URL, '');

    // Save the RDF with the current path using the database manager
    var publishResult = await databaseManager.save(account, targetPath, compactedGraph);


    notify(`Dataset published to ${datasetUri}\n`);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error\n' };
    }

    return { code: 200, message: report };


  } catch (err) {
    console.log(err);
    return { code: 500, message: err };
  }
}
