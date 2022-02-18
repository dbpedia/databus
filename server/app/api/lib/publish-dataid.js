const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');

var signer = require('./databus-tractate-suite');
var shaclTester = require('../../common/shacl/shacl-tester');
var GstoreHelper = require('../../common/gstore-helper');
var jsonld = require('jsonld');
var sparql = require('../../common/queries/sparql');
var defaultContext = require('../../../../model/generated/context.json');
var constructor = require('../../common/execute-construct.js');
var constructVersionQuery = require('../../common/queries/constructs/construct-version.sparql');
var autocompleter = require('./dataid-autocomplete');
var fileAnalyzer = require('../../common/file-analyzer');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');

module.exports = async function publishDataid(account, data, verifyParts, notify) {

  try {

    // Fetch only relevant triples from the input via construct query
    var triples = await constructor.executeConstruct(data, constructVersionQuery);
    var tripleCount = DatabusUtils.lineCount(triples);
    
    if (tripleCount == 0) {
      notify(`Construct query did not yield any triples. Nothing to publish.`);
      return { code: 100, message: null };
    }

    notify(`${tripleCount} triples selected via construct query.`);

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
      notify(`Auto-completed the input.`);
    }
    
    if(verifyParts) {

      var distributions = JsonldUtils.getTypedGraphs(expandedGraph, DatabusUris.DATAID_PART);

      for(var distribution of distributions) {

        notify(`Analyzing part "${distribution[DatabusUris.JSONLD_ID]}"`);
        var downloadURL = distribution[DatabusUris.DCAT_DOWNLOAD_URL][0][DatabusUris.JSONLD_ID];

        console.log(downloadURL);

        var analyzeResult = await fileAnalyzer.analyzeFile(downloadURL, function(msg) {
          
        });

        if(analyzeResult.code != 200) {
          notify(`Error analyzing file:`);
          notify(`${analyzeResult.data}`);
          return { code: 400, message: null };
        }

        distribution[DatabusUris.DATAID_SHASUM] = [ {} ];
        distribution[DatabusUris.DATAID_SHASUM][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.shasum;
        
        distribution[DatabusUris.DCAT_BYTESIZE] = [ {} ];
        distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.byteSize;
        distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
      }
    }

    console.log(JSON.stringify(expandedGraph, null, 3));


    // Validate the group RDF with the shacl validation tool of the gstore
    var shaclResult = await shaclTester.validateDataidRDF(expandedGraph);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {

      notify(`SHACL validation error:`);

      for (var message of shaclResult.messages) {
        notify(`   * ${message}`);
      }

      return { code: 400, message: null };
    }

    notify(`SHACL validation successful.`);

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
    var proofGraph = JsonldUtils.getGraphById(expandedGraph, proofId);
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

      proofGraph = signer.createProof(expandedGraph);
      datasetGraph[DatabusUris.SEC_PROOF] = [proofGraph];
      expandedGraph = await jsonld.flatten(expandedGraph);
    }

    // Get the type of the proof graph
    var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

    // Validate the used proof type
    if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {

      notify(`Error: Unkown proof type "${proofType}"`);
      return { code: 400, message: null };
    }

    // Validate the proof 
    var validationSuccess = await signer.validate(signer.canonicalize(expandedGraph), proofGraph);

    if (!validationSuccess) {

      if(generatingSignature) {
        notify('Failed to generate signature. Please contact an administrator.');
        return { code: 500, message: null };
      } else {
        notify('The provided signature was invalid.');
        return { code: 400, message: null };
      }
    }

    notify(`Signature validation successful.`);

    // Create compacted graph
    var compactedGraph = await jsonld.compact(expandedGraph, defaultContext);

    // TODO enable this: 
    compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_DEFAULT_CONTEXT_URL;


    // Create the target path for the gstore
    var targetPath = UriUtils.getPrunedPath(`${datasetVersionUri}/${Constants.DATABUS_FILE_DATAID}`);

    notify(`Saving to "${datasetUri}"`);

    console.log(JSON.stringify(compactedGraph, null, 3));

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(account, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error' };
    }

    return { code: 200, message: 'Success.' };

  } catch (err) {
    console.log(err);
    return { code: 500, message: err };
  }
}
