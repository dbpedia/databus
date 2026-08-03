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

    var description = JsonldUtils.getFirstProperty(inputGroupGraph, DatabusUris.DCT_DESCRIPTION);
    if (description != null) {
      groupGraph[DatabusUris.DCT_DESCRIPTION] = inputGroupGraph[DatabusUris.DCT_DESCRIPTION];
    }

    var abstract = JsonldUtils.getFirstProperty(inputGroupGraph, DatabusUris.DCT_ABSTRACT);
    if (abstract != null) {
      groupGraph[DatabusUris.DCT_ABSTRACT] = inputGroupGraph[DatabusUris.DCT_ABSTRACT];
    } else if (description != null) {
      JsonldUtils.setLiteral(groupGraph, DatabusUris.DCT_ABSTRACT, null,
        DatabusUtils.createAbstractFromDescription(description));
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
