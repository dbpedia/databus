const JsonldUtils = require('../common/utils/jsonld-utils');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../common/utils/databus-uris');

var shaclTester = require('../common/shacl/shacl-tester');
var databaseManager = require('../common/remote-database-manager');
var jsonld = require('jsonld');
var constructor = require('../common/execute-construct.js');
var constructGroupQuery = require('../common/queries/constructs/construct-group.sparql');
var defaultContext = require('../../../context.json');
const Constants = require('../common/constants');

module.exports = async function publishGroup(account, data, notify) {

  try {

    notify(`Publishing Group.\n`);

    
    // Get the desired triples from the data via construct query
    var triples = await constructor.executeConstruct(data, constructGroupQuery);

    var tripleCount = triples.split(/\r\n|\r|\n/).length
    notify(`> ${tripleCount} triples selected via construct query.\n`);


    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

   

    // No data - no publish
    if (expandedGraphs.length == 0) {
      return;
    }

    // More than one group specified - error
    if (expandedGraphs.length > 1) {
      return {
        code: 400, message:
          `You cannot specify multiple graphs. (${expandedGraphs.length} specified) \n`
      };
    }

    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateGroupRDF(expandedGraphs);

    // Shacl validation unsuccessful - error
    if (!shaclResult.isSuccess) {
      var response = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        response += `>>> ${shaclResult.messages[m]}\n`
      }

      return { code: 400, message: response };
    }

    notify(`> SHACL validation successful.\n`);

    // Get the group graph (enforced by earlier SHACL test)
    var groupGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_GROUP);
    var groupUri = groupGraph['@id'];

    
    var expectedUriPrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account}`;

    // Check for namespace violation
    if (!groupUri.startsWith(expectedUriPrefix)) {
      return { code: 403, message: `Invalid group identifier ${groupUri}.\n` };
    }

    notify(`> Saving to ${groupUri}\n`);

    // Compact graph, determine target path
    var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

    var targetPath = UriUtils.getPrunedPath(`${groupUri}/${Constants.DATABUS_FILE_GROUP}`);

    // Save the RDF with the current path using the database manager
    var publishResult = await databaseManager.save(account, targetPath, compactedGraph);

    // Return failure
    if (!publishResult.isSuccess) {
      return { code: 500, message: 'Internal database error.\n' };
    }

    return { code: 200, message: 'Success.\n' };

  } catch (err) {
    console.log(err);
    return { code: 500, message: err };
  }
}
