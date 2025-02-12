
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusMessage = require('../../common/databus-message');
const ApiError = require('../../common/utils/api-error');
const GstoreResource = require('./gstore-resource');
const shaclTester = require('../../common/shacl-tester');
const jsonld = require('jsonld');
const JsonldLoader = require('../../common/utils/jsonld-loader');
const DatabusResource = require('../../common/databus-resource');

/**
 * Base class for all writers:
 * CollectionWriter
 * GroupWriter
 * AccountWriter
 * ArtifactWriter
 * TODO: VersionWriter
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
  async writeResource(userData, inputGraphs, uri) {
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
    await this.onValidateUser();

    // Create the graphs - abstract method implemented by the different writers
    var graphs = await this.onCreateGraphs();

    // Do SHACL validation - calls abstract getSHACLFilePath()
    var shaclResult = await shaclTester.validateJsonld(graphs, this.getSHACLFilePath());

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
      var gstoreResource = new GstoreResource(this.uri, compactedGraph);
      await gstoreResource.save();

      this.logger.info(this.uri, `Successfully published ${this.resource.getTypeName()} <${this.uri}>.`, compactedGraph);
    } catch (err) {
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
  async onValidateUser() {

    if(this.userData.accountName == null) {
      let message = `The user has not yet claimed an account namespace. Please finish registering your account.`;
      throw new ApiError(403, this.uri, message, null);
    }

    var namespacePrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${this.userData.accountName}/`;
    if (!`${this.uri}/`.startsWith(namespacePrefix)) {
      let message = `Identifier <${this.uri}> does not start with the expected namespace prefix <${namespacePrefix}>.`;
      throw new ApiError(403, this.uri, message, null);
    }
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