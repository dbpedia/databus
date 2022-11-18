const JsonldUtils = require('../../common/utils/jsonld-utils');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');

var shaclTester = require('../../common/shacl/shacl-tester');
var GstoreHelper = require('../../common/utils/gstore-helper');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructArtifactQuery = require('../../common/queries/constructs/construct-artifact.sparql');
var defaultContext = require('../../../../model/generated/context.json');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
var autocompleter = require('./dataid-autocomplete');

module.exports = async function publishArtifact(accountName, data, uri, notify, debug) {

  try {

    // Get the desired triples from the data via construct query
    var triples = await constructor.executeConstruct(data, constructArtifactQuery);
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

    var before = JSON.stringify(expandedGraphs);
    autocompleter.autocompleteArtifact(expandedGraphs);
    var after = JSON.stringify(expandedGraphs);

    if (before != after) {
      notify(`Auto-completed the input.`);
      if (debug) {
        notify(JSON.stringify(expandedGraphs, null, 3));
      }
    }


    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateArtifactRDF(expandedGraphs);

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
    var artifactGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_ARTIFACT);
    var artifactUri = artifactGraph['@id'];

    if(uri != undefined && uri != artifactUri) {
      notify(`Forbidden: Invalid artifact identifier "${artifactUri}". Expected "${uri}"`);
      return { code: 403, message: null };
    }

    var expectedUriPrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

    // Check for namespace violation
    if (!artifactUri.startsWith(expectedUriPrefix)) {
      return { code: 403, message: `Invalid artifact identifier ${artifactUri}.` };
    }

    var targetPath = UriUtils.getPrunedPath(`${artifactUri}/${Constants.DATABUS_FILE_ARTIFACT}`);
    var groupName = UriUtils.getPrunedPath(artifactUri, 2);

    if(groupName == Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER) {
      notify(`Cannot create an artifact in a group with name ${Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER} as it is reserved for Databus Collections`);
    }

    notify(`Saving to "${artifactUri}"`);

    // Compact graph, determine target path
    var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

    // Save the RDF with the current path using the database manager
    var publishResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

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
