
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusMessage = require('../../common/databus-message');
const ApiError = require('../../common/utils/api-error');
const GstoreResource = require('./gstore-resource');
const shaclTester = require('../../common/shacl-tester');
const jsonld = require('jsonld');
const JsonldLoader = require('../../common/utils/jsonld-loader');
const DatabusResource = require('../../common/databus-resource');

class ResourceWriter {

  constructor(logger) {
    this.logger = logger;
  }

  async writeResource(userData, inputGraphs, uri) {
    this.userData = userData;
    this.inputGraphs = inputGraphs;

    this.resource = new DatabusResource(uri);
    this.uri = uri;

    var baseURL = process.env.DATABUS_RESOURCE_BASE_URL;

    this.logger.debug(`Processing resource <${uri}}>"...`);

    if (!uri.startsWith(baseURL)) {
      let message = `Identifier <${uri}> does not start with the resource base url <${baseURL}> of this Databus.`;
      throw new ApiError(400, uri, message, null);
    }

    await this.onValidateUser();

    var graphs = await this.onCreateGraphs();

    var shaclResult = await shaclTester.validateJsonld(graphs, this.getSHACLFilePath());

    if (!shaclResult.isSuccess) {
      var message = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        message += `>>> ${shaclResult.messages[m]}\n`
      }

      throw new ApiError(400, this.uri, message, shaclResult.report);
    }

    var compactedGraph = await jsonld.compact(graphs, JsonldLoader.DEFAULT_CONTEXT_URL);
    this.logger.debug(this.uri, `Compacted with context <${JsonldLoader.DEFAULT_CONTEXT_URL}>`);

    try {
      this.logger.debug(this.uri, `Saving to gstore.`);
      var gstoreResource = new GstoreResource(this.uri, compactedGraph);
      await gstoreResource.save();

      this.logger.info(this.uri, `Successfully published ${this.resource.getTypeName()} <${this.uri}>.`, compactedGraph);
    } catch (err) {
      let message = `Failed to save to gstore: ${err.message}`;
      throw new ApiError(500, this.uri, message, compactedGraph);
    }

    if (process.send != undefined) {
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
        resource: this.uri
      });
    }

  }

  getSHACLFilePath() {
    return '';
  }

  async onValidateUser() {
    var namespacePrefix = `${process.env.DATABUS_RESOURCE_BASE_URL}/${this.userData.accountName}/`;
    if (!`${this.uri}/`.startsWith(namespacePrefix)) {
      let message = `Identifier <${this.uri}> does not start with the expected namespace prefix <${namespacePrefix}>.`;
      throw new ApiError(403, this.uri, message, null);
    }
  }

  async onCreateGraphs() {
    return [];
  }
}

module.exports = ResourceWriter;