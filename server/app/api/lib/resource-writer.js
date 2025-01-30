 
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusMessage = require('../../common/databus-message');
const ApiError = require('../../common/utils/api-error');
const DatabusResource = require('./databus-resource');
const GstoreResource = require('./gstore-resource');
const shaclTester = require('../../common/shacl-tester');
const jsonld = require('jsonld');

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
            throw new ApiError(`Identifier <${uri}> does not start with the resource base url <${baseURL}> of this Databus.`, 400);
        }

        await this.onValidateUser();

        
        var graphs = await this.onCreateGraphs();

        var shaclResult = await shaclTester.validateJsonld(graphs, this.getSHACLFilePath());

        if (!shaclResult.isSuccess) {
            var response = 'SHACL validation error:\n';
            for (var m in shaclResult.messages) {
              response += `>>> ${shaclResult.messages[m]}\n`
            }
      
            throw new ApiError(response, 400);
        }
      
        var compactedGraph = await jsonld.compact(graphs, process.env.DATABUS_CONTEXT_URL);
        this.logger.debug(this.uri, `Compacted with context <${process.env.DATABUS_CONTEXT_URL}>`);

        try {
            this.logger.debug(this.uri, `Saving to gstore.`);
            var gstoreResource = new GstoreResource(this.uri, compactedGraph);
            await gstoreResource.save();
        } catch(err) {
            throw new ApiError(err.message, 400);
        }

        if(process.send != undefined) {
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
          throw new ApiError(`Identifier <${this.uri}> does not start with the expected namespace prefix <${namespacePrefix}>.`, 403);
        }
    }

    async onCreateGraphs() { 
        return [];
    }
 }

module.exports = ResourceWriter;