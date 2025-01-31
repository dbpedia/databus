const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const ResourceWriter = require('./resource-writer.js');

class GroupWriter extends ResourceWriter {

  constructor(logger) {
    super(logger);
  }

  async onCreateGraphs() {

    var inputGroupGraph = JsonldUtils.getGraphById(this.inputGraphs, this.uri);

    var groupGraph = {};
    groupGraph[DatabusUris.JSONLD_ID] = this.uri;
    groupGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_GROUP;
    groupGraph[DatabusUris.DATABUS_NAME] = this.resource.getGroup();
    groupGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = JsonldUtils.refTo(this.resource.getAccountURI());

    if(inputGroupGraph[DatabusUris.DCT_TITLE] != null) {
      groupGraph[DatabusUris.DCT_TITLE] = inputGroupGraph[DatabusUris.DCT_TITLE];
    }

    if(inputGroupGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      groupGraph[DatabusUris.DCT_DESCRIPTION] = inputGroupGraph[DatabusUris.DCT_DESCRIPTION];
    }

    if(inputGroupGraph[DatabusUris.DCT_ABSTRACT] != null) {
      groupGraph[DatabusUris.DCT_ABSTRACT] = inputGroupGraph[DatabusUris.DCT_ABSTRACT];
    } else if (groupGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      groupGraph[DatabusUris.DCT_DESCRIPTION] = DatabusUtils.createAbstractFromDescription(groupGraph[DatabusUris.DCT_DESCRIPTION]);
    }

    return [
      groupGraph
    ];
  }

  getSHACLFilePath() {
    return './res/shacl/group.shacl'
  }
}

module.exports = GroupWriter;
