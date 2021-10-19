const JsonldUtils = require('../common/utils/jsonld-utils');
const UriUtils = require('../common/utils/uri-utils');
const RDF_URIS = require('./rdf-uris');

var signer = require('./databus-tractate-suite');
var shaclTester = require('../common/shacl/shacl-tester');
var databaseManager = require('../common/remote-database-manager');
var jsonld = require('jsonld');
var sparql = require('../common/queries/sparql');
var defaultContext = require('../../../context.json');
var constructor = require('../common/execute-construct.js');  
var constructVersionQuery = require('../common/queries/constructs/construct-version.sparql');

const dataidFileName = 'dataid.jsonld';

module.exports = async function publishDataid(account, data) {

  try {

    var report = '';

    console.log(`Running construct...`);
    var triples = await constructor.executeConstruct(data, constructVersionQuery);
    console.log(triples);
    console.log(`Done.`);

    var expandedGraph = await jsonld.flatten(await jsonld.fromRDF(triples));

    // Generate dynamic shacl test ?

    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateDataidRDF(expandedGraph);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      var response = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        response += `>>> ${shaclResult.messages[m]}\n`
      }

      return { code: 400, message: response };
    }

    // Validate all identifiers...
    var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, RDF_URIS.DATASET);
    var datasetUri = datasetGraph['@id'];

    var datasetPublisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, RDF_URIS.PROP_PUBLISHER);
    var datasetGroupUri = JsonldUtils.getFirstObjectUri(datasetGraph, RDF_URIS.PROP_GROUP);
    var datasetArtifactUri = JsonldUtils.getFirstObjectUri(datasetGraph, RDF_URIS.PROP_ARTIFACT);
    var datasetVersionUri = JsonldUtils.getFirstObjectUri(datasetGraph, RDF_URIS.PROP_VERSION);

    // Validate Group URI
    var expectedGroupUri = UriUtils.navigateUp(datasetUri, 2);
    if (datasetGroupUri != expectedGroupUri) {

      return {
        code: 400, message:
          `The specified dataset group identifier does not match the expected identifier.\n
          (Specified: ${datasetGroupUri}, expected: ${expectedGroupUri})\n`
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

    // Only use the selected graphs 
    /*
    expandedGraph = [
      artifactGraph,
      versionGraph,
      datasetGraph
    ];

    for(var graph of contentVariantGraphs) {
      expandedGraph.push(graph);
    }

    for(var graph of fileGraphs) {
      expandedGraph.push(graph);
    } */

    console.log(`Publisher found: ${datasetPublisherUri}...`);
    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account}`;

    report += `-- Publisher: ${datasetPublisherUri}.\n`;

    // Validate the publisher and account (<publisherUri> <foaf:account> <accountUri>)
    var isPublisherConnectedToAccount =
      await sparql.accounts.getPublisherHasAccount(datasetPublisherUri, accountUri);

    if (!isPublisherConnectedToAccount) {
      return { code: 400, message: 'The specified publisher is not associated with the requested account' };
    }

    // Check for proof
    var proofGraph = JsonldUtils.getFirstObject(datasetGraph, RDF_URIS.PROOF, expandedGraph);

    // Not setting the proof is allowed!
    if (proofGraph == undefined) {

      // No proof yet, try to create one
      console.log('No signature found...');

      // Verify if this account is an internal one
      if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        return { code: 400, message: 'Uploads using an external account need to provide a signature' };
      }

      report += "-- Proof generated with internal key.\n";
      console.log('Internal account detected. Generating proof...');
      proofGraph = signer.createProof(expandedGraph);
      datasetGraph[RDF_URIS.PROOF] = [proofGraph];
    }

    // Get the type of the proof graph
    var proofType = JsonldUtils.getFirstObject(proofGraph, RDF_URIS.TYPE);

    // console.log(`Proof found: ${proofType}`);
    if (proofType != RDF_URIS.DB_TRACTATE_V1) {
      return { code: 400, message: `Unkown proof type "${proofType}"\n` };
    }

    // Validate
    var validationSuccess = await signer.validate(signer.canonicalize(expandedGraph), proofGraph);

    if (!validationSuccess) {
      return { code: 400, message: 'The provided signature is invalid\n' };
    }


    report += "-- Proof validation successful.\n";

    // Create compacted graph
    var compactedGraph = await jsonld.compact(expandedGraph, defaultContext);
    var targetPath = `${datasetVersionUri}/${dataidFileName}`.replace(process.env.DATABUS_RESOURCE_BASE_URL, '');

    // Save the RDF with the current path using the database manager
    var publishResult = await databaseManager.save(account, targetPath, compactedGraph);

    report += `-- Dataset published to ${datasetUri}\n`;

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
