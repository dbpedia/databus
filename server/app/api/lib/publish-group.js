const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');

var shaclTester = require('../../common/shacl/shacl-tester');
var databaseManager = require('../../common/remote-database-manager');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructGroupQuery = require('../../common/queries/constructs/construct-group.sparql');
var defaultContext = require('../../../../model/generated/context.json');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');

module.exports = async function publishGroup(account, data, uri, notify) {

  try {

    // Get the desired triples from the data via construct query
    var triples = await constructor.executeConstruct(data, constructGroupQuery);
    var tripleCount = DatabusUtils.lineCount(triples);
    
    if (tripleCount == 0) {
      notify(`Construct query did not yield any triples. Nothing to publish.`);
      return { code: 100, message: null };
    }

    notify(`${tripleCount} triples selected via construct query.`);

    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

    // No data - no publish
    if (expandedGraphs.length == 0) {
      notify(`Construct query did not yield any triples. Nothing to publish.`);
      return { code: 100, message: null };
    }

    // More than one group specified - error
    if (expandedGraphs.length > 1) {
      return {
        code: 400, message:
          `You cannot specify multiple graphs. (${expandedGraphs.length} specified)`
      };
    }


    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateGroupRDF(expandedGraphs);

    console.log(shaclResult);


    // Return failure with SHACL validation message
    if (!shaclResult.isSuccess) {

      notify(`SHACL validation error:`);

      for (var message of shaclResult.messages) {
        notify(`   * ${message}`);
      }

      return { code: 400, message: null };
    }

    notify(`SHACL validation successful.`);

    // Get the group graph (enforced by earlier SHACL test)
    var groupGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_GROUP);
    var groupUri = groupGraph['@id'];

    if(uri != undefined && uri != groupUri) {
      notify(`Forbidden: Invalid group identifier "${groupUri}". Expected "${uri}"`);
      return { code: 403, message: null };
    }


    var expectedUriPrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account}`;

    // Check for namespace violation
    if (!groupUri.startsWith(expectedUriPrefix)) {
      return { code: 403, message: `Invalid group identifier ${groupUri}.` };
    }

    var targetPath = UriUtils.getPrunedPath(`${groupUri}/${Constants.DATABUS_FILE_GROUP}`);

    var groupIdentifier = UriUtils.getPrunedPath(groupUri, 1);

    if(groupIdentifier == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      notify(`Cannot create group with name ${Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER} as it is reserved for Databus Collections`);
    }

    notify(`Saving to "${groupUri}"`);

    // Compact graph, determine target path
    var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

    
    // Save the RDF with the current path using the database manager
    var publishResult = await databaseManager.save(account, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error.' };
    }

    return { code: 200, message: 'Success.' };

  } catch (err) {
    console.log(err);
    return { code: 500, message: err };
  }
}
