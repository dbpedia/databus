
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusMessage = require('../../common/databus-message');
const ApiError = require('../../common/utils/api-error');
const GstoreResource = require('./gstore-resource');
const shaclTester = require('../../common/shacl-tester');
const jsonld = require('jsonld');
const JsonldLoader = require('../../common/utils/jsonld-loader');
const DatabusResource = require('../../common/databus-resource');
const ServerUtils = require('../../common/utils/server-utils');

/**
 * Base class for all writers:
 * CollectionWriter
 * GroupWriter
 * AccountWriter
 * ArtifactWriter
 * VersionWriter
 */
class ResourceWriter {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 
   * @param {user data with account name and OIDC sub} userData 
   * @param {the input JSONLD graphs} inputGraphs 
   * @param {uri of the resource to write} uri 
   */
  async writeResource(req, userData, inputGraphs, uri) {
    this.userData = userData;
    this.inputGraphs = inputGraphs;
    this.uri = uri;

    // Create Databus resource object for segment parsing
    this.resource = new DatabusResource(uri);

    var baseURL = process.env.DATABUS_RESOURCE_BASE_URL;

    this.logger.debug(`Processing resource <${uri}}>"...`);

    // First base URL prefix check
    if (!uri.startsWith(baseURL)) {
      let message = `Identifier <${uri}> does not start with the resource base url <${baseURL}> of this Databus.`;
      throw new ApiError(400, uri, message, null);
    }

    // Validate the user - checks URI prefix and account name
    await this.onValidateUser(req);

    // Create the graphs - abstract method implemented by the different writers
    var graphs = await this.onCreateGraphs();

    if (graphs == null || graphs.length === 0) {
      this.logger.debug(this.uri, `Nothing to publish.`, null);
      return;
    }

    console.log("INPUT FOR SHACL TEST");
    console.log(JSON.stringify(graphs, null, 3));


    // Do SHACL validation - calls abstract getSHACLFilePath()
    var shaclResult = await shaclTester.validateJsonld(graphs, this.getSHACLFilePath());

    console.log("SHACL RESULT");
    console.log(JSON.stringify(shaclResult, null, 3));

    if (!shaclResult.isSuccess) {
      var message = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        message += `>>> ${shaclResult.messages[m]}\n`
      }

      throw new ApiError(400, this.uri, message, shaclResult.report);
    }

    // Compact the graph with the default context
    var compactedGraph = await jsonld.compact(graphs, JsonldLoader.DEFAULT_CONTEXT_URL);
    this.logger.debug(this.uri, `Compacted with context <${JsonldLoader.DEFAULT_CONTEXT_URL}>`);

    try {

      // Save the compacted graph to the gstore
      this.logger.debug(this.uri, `Saving to gstore.`);
      var gstoreResource = new GstoreResource(this.uri, compactedGraph, this.getDocumentFilename());


      await gstoreResource.save();

      this.logger.info(this.uri, `Successfully published ${this.resource.getTypeName()} <${this.uri}>.`, compactedGraph);
    } catch (err) {

      console.log(JSON.stringify(err, null, 3));
      console.log(JSON.stringify(compactedGraph, null, 3));
      let message = `Failed to save to gstore: ${err.message}`;
      throw new ApiError(500, this.uri, message, compactedGraph);
    }

    // Send a message to invoke the resource indexer
    if (process.send != undefined) {
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
        resource: this.uri
      });
    }

  }

  /**
   * VIRTUAL - overriden in VersionWriter for dataid.jsonld
   * @returns gstore document filename relative to the resource path
   */
  getDocumentFilename() {
    return GstoreResource.METADATA_FILENAME;
  }

  /**
   * ABSTRACT - implemented in the different writers
   * @returns the file path of the SHACL file for graph validation
   */
  getSHACLFilePath() {
    return '';
  }

  /**
   * VIRTUAL - overriden in AccountWriter to allow registering of new users
   * Validates user account name against the resource identifiers
   */
  async onValidateUser(req) {
    if (await ServerUtils.hasWriteAccess(req, this.resource.account, this.uri)) {
      return;
    }

    const message = `Authenticated user does not have write access to the account <${this.resource.account}>.`;
    throw new ApiError(403, this.uri, message, null);
  }

  /**
   * ABSTRACT - implemented in the different writers
   * @returns a list of graphs to save to the database
   */
  async onCreateGraphs() {
    return [];
  }
}

module.exports = ResourceWriter;