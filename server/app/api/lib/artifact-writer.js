const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const ResourceWriter = require('./resource-writer.js');

class ArtifactWriter extends ResourceWriter {

  constructor(logger) {
    super(logger);
  }

  async onCreateGraphs() {
      
    var inputArtifactGraph = JsonldUtils.getGraphById(this.inputGraphs, this.uri);

    var artifactGraph = {};
    artifactGraph[DatabusUris.JSONLD_ID] = this.uri;
    artifactGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_ARTIFACT;
    artifactGraph[DatabusUris.DATABUS_NAME] = this.resource.getArtifact();
    artifactGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = JsonldUtils.refTo(this.resource.getAccountURI());
    artifactGraph[DatabusUris.DATABUS_GROUP_PROPERTY] = JsonldUtils.refTo(this.resource.getGroupURI());

    if(inputArtifactGraph[DatabusUris.DCT_TITLE] != null) {
      artifactGraph[DatabusUris.DCT_TITLE] = inputArtifactGraph[DatabusUris.DCT_TITLE];
    }

    if(inputArtifactGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      artifactGraph[DatabusUris.DCT_DESCRIPTION] = inputArtifactGraph[DatabusUris.DCT_DESCRIPTION];
    }

    if(inputArtifactGraph[DatabusUris.DCT_ABSTRACT] != null) {
      artifactGraph[DatabusUris.DCT_ABSTRACT] = inputArtifactGraph[DatabusUris.DCT_ABSTRACT];
    } else if (artifactGraph[DatabusUris.DCT_DESCRIPTION] != null) {
      artifactGraph[DatabusUris.DCT_DESCRIPTION] = DatabusUtils.createAbstractFromDescription(artifactGraph[DatabusUris.DCT_DESCRIPTION]);
    }

    var groupGraph = {};
    groupGraph[DatabusUris.JSONLD_ID] = this.resource.getGroupURI();
    groupGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_GROUP;

    return [
      artifactGraph,
      groupGraph
    ];
  }

  getSHACLFilePath() {
    return './res/shacl/artifact.shacl'
  }
}

module.exports = ArtifactWriter;
