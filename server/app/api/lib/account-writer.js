const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');
const DatabusConstants = require('../../../../public/js/utils/databus-constants.js');
const UriUtils = require('../../common/utils/uri-utils.js');
const ApiError = require('../../common/utils/api-error.js');
const ResourceWriter = require('./resource-writer.js');

var signer = require('./databus-tractate-suite.js');

class AccountWriter extends ResourceWriter {

  constructor(createUserCallback, logger) {
    super(logger);

    this.createUserCallback = createUserCallback;
  }

  async onValidateUser() {

    if(this.userData.accountName == null) {
      
      console.log("Account name is not set, creating user");
      
      if(!this.resource.isAccount()) { 
        throw new ApiError(400, this.uri, `Identifier <${this.uri}> is not a valid account URI.`, null);
      }

      var accountName = this.resource.getAccount();
      console.log(`Desired account name is ${accountName}`);
      
      if(accountName.length < 4) {
        throw new ApiError(400, this.uri, `Specified account name ('${accountName}') must be at least 4 characters long.`, null);
      }

      this.userData = await this.createUserCallback(this.userData.sub, accountName);
    }

    super.onValidateUser();
  }

  getInputPersonGraph() {
    for(var graph of this.inputGraphs) {

      var foafAccount = JsonldUtils.getFirstObjectUri(graph, DatabusUris.FOAF_ACCOUNT);
      
      if(foafAccount === this.uri) {
        return graph;
      }
    }

    return null;
  }

  async onCreateGraphs() {
      
    var accountUri = this.uri;
    var accountName = UriUtils.uriToName(accountUri);
    var accountGraph = JsonldUtils.getGraphById(this.inputGraphs, accountUri);

    var rsaKeyGraph = {};
    rsaKeyGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.CERT_RSA_PUBLIC_KEY;
    rsaKeyGraph[DatabusUris.RDFS_LABEL] = DatabusConstants.WEBID_SHARED_PUBLIC_KEY_LABEL;
    rsaKeyGraph[DatabusUris.CERT_MODULUS] = signer.getModulus();
    rsaKeyGraph[DatabusUris.CERT_EXPONENT] = 65537;

    var personUri = `${accountUri}${DatabusConstants.WEBID_THIS}`;

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = [ DatabusUris.FOAF_PERSON, DatabusUris.DBP_DBPEDIAN ];
    personGraph[DatabusUris.FOAF_ACCOUNT] = JsonldUtils.refTo(this.uri);
    personGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = this.uri;
    personGraph[DatabusUris.CERT_KEY] = [ rsaKeyGraph ];

    var inputPersonGraph = this.getInputPersonGraph();

    if(inputPersonGraph != null) {
      personGraph[DatabusUris.FOAF_NAME] = inputPersonGraph[DatabusUris.FOAF_NAME];
      personGraph[DatabusUris.FOAF_IMG] = inputPersonGraph[DatabusUris.FOAF_IMG];
      personGraph[DatabusUris.FOAF_STATUS] = inputPersonGraph[DatabusUris.FOAF_STATUS];
    }
  
    var profileUri = `${accountUri}${DatabusConstants.WEBID_DOCUMENT}`;

    var profileDocumentGraph = {};
    profileDocumentGraph[DatabusUris.JSONLD_ID] = profileUri;
    profileDocumentGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT;
    profileDocumentGraph[DatabusUris.FOAF_MAKER] = JsonldUtils.refTo(personUri);
    profileDocumentGraph[DatabusUris.FOAF_PRIMARY_TOPIC] = JsonldUtils.refTo(personUri);

    var accountGraph = {}
    accountGraph[DatabusUris.JSONLD_ID] = accountUri;
    accountGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.DATABUS_ACCOUNT;
    accountGraph[DatabusUris.FOAF_ACCOUNT_NAME] = accountName;
    accountGraph[DatabusUris.DATABUS_NAME] = accountName;

    return [
      accountGraph,
      personGraph,
      profileDocumentGraph
    ]
  }

  getSHACLFilePath() {
    return './res/shacl/account.shacl'
  }
}

module.exports = AccountWriter;
