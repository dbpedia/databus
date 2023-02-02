const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');
const GstoreHelper = require('../../common/utils/gstore-helper');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
var shaclTester = require('../../common/shacl/shacl-tester');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructGroupQuery = require('../../common/queries/constructs/construct-group.sparql');
var defaultContext = require('./../../common/context.json');
var autocompleter = require('./dataid-autocomplete');

module.exports = async function publishGroup(accountName, graph, logger) {

  try {

    var groupUri = graph[DatabusUris.JSONLD_ID];
    logger.debug(groupUri, `Processing group <${groupUri}>`, graph);

    // Check for namespace violation
    var expectedUriPrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}/`;
    if (!groupUri.startsWith(expectedUriPrefix)) {
      logger.error(groupUri, `Not allowed to access namespace of group identifier <${groupUri}>.`);
      return 403;
    }

    var groupName = UriUtils.cleanSegment(groupUri.replace(expectedUriPrefix, ""));

    if (UriUtils.getPathLength(groupName) != 1) {
      logger.error(groupUri, `Group uri <${groupUri}> must have exactly 2 path segments relative to the Databus base url <${process.env.DATABUS_RESOURCE_BASE_URL}> (found ${UriUtils.getPathLength(groupName)  + 1})`, null);
      return 400;
    }

    if (groupName == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      logger.error(groupUri, `Cannot create group with name "${Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER}" as it is reserved for Databus collections.`);
      return 400;
    }

    // Get the desired triples from the data via construct query
    var triples = await constructor.executeConstruct(graph, constructGroupQuery);
    var tripleCount = DatabusUtils.lineCount(triples);

    if (tripleCount == 0) {
      logger.info(groupUri, `Construct query did not yield any triples. Nothing to publish.`, graph);
      return 200;
    }

    logger.debug(groupUri, `${tripleCount} triples selected via construct query.`, triples);
    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

    // Auto-complete
    autocompleter.autocompleteGroup(expandedGraphs);
    logger.debug(groupUri, `Input has been processed by the auto-completer`, expandedGraphs);


    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateGroupRDF(expandedGraphs);

    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {
      logger.error(groupUri, `SHACL validation error`, shaclResult);
      return 400;
    }

    logger.debug(groupUri, `SHACL validation successful`, shaclResult);


    // Compact graph, determine target path
    var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

    if(process.env.DATABUS_CONTEXT_URL != null) {
      compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      logger.debug(groupUri, `Context has been resubstituted with <${process.env.DATABUS_CONTEXT_URL}>`);
    }

    var targetPath = `${groupName}/${Constants.DATABUS_FILE_GROUP}`;
    logger.debug(groupUri, `Saving group <${groupUri}> to ${accountName}:${targetPath}`, compactedGraph);


    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      logger.error(groupUri, `Internal database error`, null);
      return 500;
    }

    logger.info(groupUri, `Successfully published group <${groupUri}>.`, compactedGraph);
    return 200;

  } catch (err) {
    console.log(`Unexpected Databus error when processing group data`);
    console.log(err);
    logger.error(null, `Unexpected Databus error when processing group data`, null);
    return 500;
  }
}
