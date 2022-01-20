const JsonldUtils = require('../common/utils/jsonld-utils');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../common/utils/databus-uris');
const Constants = require('../common/constants');

var signer = require('../tractate/databus-tractate-suite');
var shaclTester = require('../common/shacl/shacl-tester');
var databaseManager = require('../common/remote-database-manager');
var jsonld = require('jsonld');
var sparql = require('../common/queries/sparql');
var defaultContext = require('../common/context.json');
var constructor = require('../common/execute-construct.js');
var constructVersionQuery = require('../common/queries/constructs/construct-version.sparql');
var autocompleter = require('../common/dataid-autocomplete');

module.exports = async function publishDataid(account, data, notify) {

  try {

    notify(`Publishing DataId.\n`);

    console.log(data);

    // Fetch only relevant triples from the input via construct query
    var triples = await constructor.executeConstruct(data, constructVersionQuery);

    if (triples.length == 0) {
      notify(`Construct query did not yield any triples. Nothing to publish.\n`)
      return { code: 200, message: null };
    }

    var tripleCount = triples.split(/\r\n|\r|\n/).length
    notify(`> ${tripleCount} triples selected via construct query.\n`);

    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account}`;

    // Convert the n-triples back to flattened jsonld
    var expandedGraph = await jsonld.flatten(await jsonld.fromRDF(triples));
    // Re-fetch the dataset graph
    var datasetGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATAID_DATASET);

    // Validate the prefix of the Dataset identifier
    if (!datasetGraph["@id"].startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
      return { code: 400, message: `${datasetGraph["@id"]} does not start with the databus base URL ${process.env.DATABUS_RESOURCE_BASE_URL}` };
    }

    // Do dataid-autocompletion
    var before = JSON.stringify(expandedGraph);
    autocompleter.autocomplete(expandedGraph, accountUri);
    var after = JSON.stringify(expandedGraph);

    if (before != after) {
      notify(`> Auto-completed the input.\n`);
    }

    // Validate the group RDF with the shacl validation tool of the gstore
    var shaclResult = await shaclTester.validateDataidRDF(expandedGraph);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {

      notify(`> SHACL validation error:\n`);

      var messages = shaclResult.message.split(/\r\n|\r|\n/);
      for (var message of messages) {

        notify(`> ${message}\n`);
      }

      return { code: 400, message: response };
    }

    notify(`> SHACL validation successful.\n`);

    // Fetch important uris
    var datasetUri = datasetGraph['@id'];
    var datasetPublisherUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DCT_PUBLISHER);
    var datasetVersionUri = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.DATAID_VERSION_PROPERTY);

    notify(`> Publishing as ${datasetPublisherUri}.\n`);

    // Validate the publisher and account (<publisherUri> <foaf:account> <accountUri>)
    var isPublisherConnectedToAccount =
      await sparql.accounts.getPublisherHasAccount(datasetPublisherUri, accountUri);

    if (!isPublisherConnectedToAccount) {
      return { code: 400, message: 'The specified publisher is not associated with the requested account' };
    }

    // Fetch the proof graph
    var proofId = JsonldUtils.getFirstObjectUri(datasetGraph, DatabusUris.SEC_PROOF);
    var proofGraph = JsonldUtils.getGraphById(expandedGraph, proofId);

    // Not setting the proof is allowed!
    if (proofGraph == undefined) {

      // No proof yet, try to create one
      notify(`> No signature found in the input.\n`);

      // Verify if this account is an internal one
      if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        return { code: 400, message: 'Uploads using an external account need to provide a signature' };
      }

      notify(`> Generating signature.\n`);
      console.log('Internal account detected. Generating proof...');
      proofGraph = signer.createProof(expandedGraph);
      datasetGraph[DatabusUris.PROOF] = [proofGraph];
    }

    // Get the type of the proof graph
    var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

    // Validate the used proof type
    if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {
      return { code: 400, message: `Unkown proof type "${proofType}"\n` };
    }

    // Validate the proof 
    var validationSuccess = await signer.validate(signer.canonicalize(expandedGraph), proofGraph);

    if (!validationSuccess) {
      return { code: 400, message: 'The provided signature is invalid\n' };
    }

    notify(`> Signature validation successful.\n`);

    // Create compacted graph
    var compactedGraph = await jsonld.compact(expandedGraph, defaultContext);
    
    // TODO enable this: compactedGraph[DatabusUris.JSONLD_CONTEXT] = Constants.DATABUS_DEFAULT_CONTEXT_URL;

    // Create the target path for the gstore
    var targetPath = UriUtils.getPrunedPath(`${datasetVersionUri}/${Constants.DATABUS_FILE_DATAID}`);

    notify(`> Saving to ${datasetUri}\n`);

    // Save the RDF with the current path using the database manager
    var publishResult = await databaseManager.save(account, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error\n' };
    }

    return { code: 200, message: 'Success.\n' };

  } catch (err) {
    console.log(err);
    return { code: 500, message: err };
  }
}
