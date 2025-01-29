const axios = require('axios');
const FormData = require('form-data');
var fs = require('fs');

class IndexingTask {

    static PARAM_CONFIG = "config";
    static PARAM_VALUES = "values";
    static ROUTE_INDEX = "/api/index/run";
    static ROUTE_DELETE = "/api/index/delete";
    static ENCODING_UTF8 = [ 'utf8' ];

    constructor(resourceURI, indexGroup) {
        this.resourceURI = resourceURI;
        this.indexGroup = indexGroup;
    }

    async run() {
        try {

            const deleteFormData = new FormData();

            if(this.resourceURI != null) {
                deleteFormData.append(IndexingTask.PARAM_VALUES, this.resourceURI);
                // FIRST: Delete document from index
                try {
                    var response = await axios.post(`${process.env.LOOKUP_BASE_URL}${IndexingTask.ROUTE_DELETE}`, deleteFormData,
                        {
                            headers: {
                                ...deleteFormData.getHeaders(), // Ensure the proper headers for multipart
                            },
                        }
                    );
                    console.log(`Resource <${this.resourceURI}> dropped from index: ${response.status}`);
                } catch(err) {
                    console.log(`Failed to delete resource <${this.resourceURI}> from index: ${err}`);
                } 
            }
            
            if(this.indexGroup == null) {
                return;
            }

            let resourceLabel = "all";

            if(this.resourceURI != null) {
                resourceLabel = this.resourceURI;
            }

            // SECOND: Sequentially run all indexers of the specified group for the resource
            // console.log(`Reindexing <${resourceLabel}> with index group <${this.indexGroup.getName()}>`);

            for(var configPath of this.indexGroup.getIndexConfigurationPaths()) {

                const indexFormData = new FormData();

                if(this.resourceURI != null) {
                    indexFormData.append(IndexingTask.PARAM_VALUES, this.resourceURI);
                }

                indexFormData.append(IndexingTask.PARAM_CONFIG, fs.createReadStream(configPath));

                try {
                    let response = await axios.post(`${process.env.LOOKUP_BASE_URL}${IndexingTask.ROUTE_INDEX}`, indexFormData,
                        {
                            headers: {
                                ...indexFormData.getHeaders(), // Ensure the proper headers for multipart
                            },
                        }
                    );
                    console.log(`Resource <${resourceLabel}> indexed with config ${configPath}: ${response.status}`);
                } catch (err) {
                    console.log(`Indexer ${configPath} failed: ${err}`);
                }
            }

        } catch (err) {
            console.log(`Indexing task failed: ${err}`);
        }   
    }

    equals(task) {
        if (this == task) return true;

        if(task.resourceURI == this.resourceURI && task.indexGroup == this.indexGroup) {
            return true;
        }

        return false;
    }
}

module.exports = IndexingTask;