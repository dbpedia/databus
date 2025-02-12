const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const ResourceWriter = require('./resource-writer.js');

class CollectionWriter extends ResourceWriter {

  constructor(logger) {
    super(logger);
  }

  async onCreateGraphs() {

    var inputCollectionGraph = JsonldUtils.getGraphById(this.inputGraphs, this.uri);

    var collectionGraph = {};
    collectionGraph[DatabusUris.JSONLD_ID] = this.uri;
    collectionGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_COLLECTION;
    collectionGraph[DatabusUris.DATABUS_NAME] = this.resource.getArtifact();
    collectionGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = JsonldUtils.refTo(this.resource.getAccountURI());
    collectionGraph[DatabusUris.DATABUS_COLLECTION_CONTENT] = inputCollectionGraph[DatabusUris.DATABUS_COLLECTION_CONTENT];

    if(inputCollectionGraph[DatabusUris.DCT_TITLE] != null) {
      collectionGraph[DatabusUris.DCT_TITLE] = inputCollectionGraph[DatabusUris.DCT_TITLE];
    }

    if(inputCollectionGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      collectionGraph[DatabusUris.DCT_DESCRIPTION] = inputCollectionGraph[DatabusUris.DCT_DESCRIPTION];
    }

    if(inputCollectionGraph[DatabusUris.DCT_ABSTRACT] != null) {
      collectionGraph[DatabusUris.DCT_ABSTRACT] = inputCollectionGraph[DatabusUris.DCT_ABSTRACT];
    } else if (collectionGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      collectionGraph[DatabusUris.DCT_DESCRIPTION] = DatabusUtils.createAbstractFromDescription(collectionGraph[DatabusUris.DCT_DESCRIPTION]);
    }

    var groupGraph = {};
    groupGraph[DatabusUris.JSONLD_ID] = this.resource.getGroupURI();
    groupGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_GROUP;

    return [
      collectionGraph
    ];
  }

  getSHACLFilePath() {
    return './res/shacl/collection.shacl'
  }
}

module.exports = CollectionWriter;
