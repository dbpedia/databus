const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');

var shaclTester = require('../../common/shacl-tester');
var GstoreHelper = require('../../common/utils/gstore-helper');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructArtifactQuery = require('../../common/queries/constructs/construct-artifact.sparql');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
var autocompleter = require('./dataid-autocomplete');
const DatabusMessage = require('../../common/databus-message');

module.exports = async function publishArtifact(accountName, graph, logger) {


  try {

    var artifactUri = graph[DatabusUris.JSONLD_ID];
    logger.debug(artifactUri, `Processing artifact <${artifactUri}>`, graph);

    // Check for namespace violation
    var expectedUriPrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}/`;

    if (!artifactUri.startsWith(expectedUriPrefix)) {
      logger.error(artifactUri, `Not allowed to access namespace of artifact identifier <${artifactUri}>.`);
      return 403;
    }

    var artifactSegment = UriUtils.cleanSegment(artifactUri.replace(expectedUriPrefix, ""));

    if (UriUtils.getPathLength(artifactSegment) != 2) {
      logger.error(artifactUri, `Artifact uri <${artifactUri}> must have exactly 3 path segments relative to the Databus base url <${process.env.DATABUS_RESOURCE_BASE_URL}> (found ${UriUtils.getPathLength(artifactSegment) + 1})`, null);
      return 400;
    }

    var segments = artifactSegment.split("/");
    var groupName = segments[0];
    var artifactName = segments[1];

    if (groupName == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      logger.error(artifactUri, `Cannot create artifact with group name "${Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER}" as it is reserved for Databus collections.`);
      return 400;
    }

    // Get the desired triples from the data via construct query
    var triples = await constructor.executeConstruct(graph, constructArtifactQuery);
    var tripleCount = DatabusUtils.lineCount(triples);

    if (tripleCount == 0) {
      logger.info(artifactUri, `Construct query did not yield any triples. Nothing to publish.`, graph);
      return 200;
    }

    logger.debug(artifactUri, `${tripleCount} triples selected via construct query.`, triples);
    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

    // Auto-complete
    autocompleter.autocompleteArtifact(expandedGraphs);
    logger.debug(artifactUri, `Input has been processed by the auto-completer`, expandedGraphs);

    // Validate the artifact RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateArtifactRDF(expandedGraphs);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      logger.error(artifactUri, `SHACL validation error`, shaclResult);
      return 400;
    }

    logger.debug(artifactUri, `SHACL validation successful`, shaclResult);


    // Compact graph, determine target path
    var compactedGraph = await jsonld.compact(expandedGraphs, process.env.DATABUS_CONTEXT_URL);
    logger.debug(artifactUri, `Compacted with context <${process.env.DATABUS_CONTEXT_URL}>`);
   
    //(if (process.env.DATABUS_CONTEXT_URL != null) {
    //  compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
    //  logger.debug(artifactUri, `Context has been resubstituted with <${process.env.DATABUS_CONTEXT_URL}>`);
    //} l

    var targetPath = `${groupName}/${artifactName}/${Constants.DATABUS_FILE_ARTIFACT}`;
    logger.debug(artifactUri, `Saving artifact <${artifactUri}> to ${accountName}:${targetPath}`, compactedGraph);

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      logger.error(artifactUri, `Internal database error`, null);
      return 500;
    }

    if(process.send != undefined) {
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
        resource: artifactUri
      });
    }

    logger.info(artifactUri, `Successfully published artifact <${artifactUri}>.`, compactedGraph);
    return 200;

  } catch (err) {
    console.log(`Unexpected Databus error when processing artifact data`);
    console.log(err);
    logger.error(null, `Unexpected Databus error when processing artifact data`, null);
    return 500;
  }
}
