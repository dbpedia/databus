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
      
      if(!this.resource.isAccount()) { 
        throw new ApiError(`Identifier <${uri}> is not a valid account URI.`, 400);
      }

      var accountName = this.resource.getAccount();

      if(accountName.length < 4) {
        throw new ApiError(`Specified account name ('${accountName}') must be at least 4 characters long.`, 400);
      }

      this.userData = await this.createUserCallback(this.userData);
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

/*
async function accountExists(accountName) {
  let accountUri = UriUtils.createResourceUri([accountName]);
  return await exec.executeAsk(`ASK { ?s <${DatabusUris.FOAF_ACCOUNT}> <${accountUri}> . }`);
}


async function publishAccount(inputGraphs, accountGraph, logger) {
  
  var accountUri = JsonldUtils.getFirstObjectUri(accountGraph, DatabusUris.JSONLD_ID);

  if (accountName.length < 4) {
    throw new ApiError(`An account name should contain at least 4 characters.`, 400);
  }

  // Expected uris
    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

    var personUri = `${accountUri}${DatabusConstants.WEBID_THIS}`;
    var profileUri = `${accountUri}${DatabusConstants.WEBID_DOCUMENT}`;

    // Compare the specified id to the actual person uri
    var personGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSON);

    if (personGraph == undefined) {
      result.message = `No person graph found`;
      result.statusCode = 400;
      return result;
    }

    // Mismatch gives error
    if (personGraph[DatabusUris.JSONLD_ID] != personUri) {
      result.message = `The specified uri of the foaf:Person does not match the expected value. (specified: ${personGraph['@id']}, expected: ${personUri})\n`;
      result.statusCode = 400;
      return result;
    }

    // Compare the specified id to the actual person uri
    var profileGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT);

    if (profileGraph == undefined) {
      result.message = `No profile graph found`;
      result.statusCode = 400;
      return result;
    }


  // URIs OK, look at content:
}


async function createUser(userDatabase, sub, accountName) {

  var accountExists = await userDatabase.hasUser(accountName);

  if(accountExists) {
    throw new ApiError(`Account <${accountName}> already exists.`, 401);
  }

  try {
    await protector.addUser(sub, accountName, accountName);
  } catch(err) {
    throw new ApiError(`Failed to write to user database`, 500);
  }
}

module.exports = async function publishAccounts(inputGraphs, accountData, userDatabase, logger) {
  // Find task related graphs
  var accountGraphs = JsonldUtils.getTypedGraphs(expandedGraphs, DatabusUris.DATABUS_ACCOUNT);
  logger.debug(null, `Found ${accountGraphs.length} account graphs.`, null);
   
  for (var accountGraph of accountGraphs) {

    var accountUri = accountGraph[DatabusUris.JSONLD_ID];
    logger.debug(null, `Found input entity <${accountUri}>.`, null);

    var accountName = accountData.name;

    if(accountName == null) {
      // Try to create the user...
      accountName = UriUtils.uriToName(accountUri);
      createUser(userDatabase, accountData.sub, accountName);
      // User is successfully created here
    }

    DatabusUtils.validateNamespace(accountUri, accountName);
    
    
    var accountUri = accountGraph[DatabusUris.JSONLD_ID];
    logger.debug(groupUri, `Processing account <${accountUri}>`, accountGraph);

    

    await publishAccount(inputGraphs, accountGraph, logger);
  }

    var accountUri = graph[DatabusUris.JSONLD_ID];
    logger.debug(groupUri, `Processing account <${accountUri}>`, graph);

    DatabusUtils.validateNamespace(accountUri, accountName);
    
    if (accountName.length < 4) {
      throw new ApiError(`An account name should contain at least 4 characters.`, 400);
    }

    // URIs OK, look at content:
    var triples = await constructor.executeConstruct(body, constructAccountQuery);
    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

    if (expandedGraphs.length == 0) {
      throw new ApiError(`The following construct query did not yield any triples:\n\n${constructAccountQuery}\n`, 400);
    }

    // Fill / construct input data










    
    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateWebIdRDF(body);

    if (!shaclResult.isSuccess) {
      var response = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        response += `>>> ${shaclResult.messages[m]}\n`
      }

      throw new ApiError(response, 400);
    }

}


module.exports = async function publishAccount(accountName, body) {

  var result = {};
  result.isSuccess = false;
  result.message = "";
  result.statusCode = 403;


  try {

    // Get the accountName from the protected request
    if (accountName.length < 4) {
      result.message = `Account name is too short. An account name should contain at least 4 characters.\n`;
      return result;
    }


    // Return failure
    if (!shaclResult.isSuccess) {
      var response = 'SHACL validation error:\n';
      for (var m in shaclResult.messages) {
        response += `>>> ${shaclResult.messages[m]}\n`
      }

      result.message = response;
      result.statusCode = 400;
      return result;
    }

    var triples = await constructor.executeConstruct(body, constructAccountQuery);
    var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

    if (expandedGraphs.length == 0) {
      result.message = `The following construct query did not yield any triples:\n\n${constructAccountQuery}\n`;
      result.statusCode = 400;
      return result;
    }

    // Expected uris
    var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

    var personUri = `${accountUri}${DatabusConstants.WEBID_THIS}`;
    var profileUri = `${accountUri}${DatabusConstants.WEBID_DOCUMENT}`;

    // Compare the specified id to the actual person uri
    var personGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSON);

    if (personGraph == undefined) {
      result.message = `No person graph found`;
      result.statusCode = 400;
      return result;
    }

    // Mismatch gives error
    if (personGraph[DatabusUris.JSONLD_ID] != personUri) {
      result.message = `The specified uri of the foaf:Person does not match the expected value. (specified: ${personGraph['@id']}, expected: ${personUri})\n`;
      result.statusCode = 400;
      return result;
    }

    // Compare the specified id to the actual person uri
    var profileGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT);

    if (profileGraph == undefined) {
      result.message = `No profile graph found`;
      result.statusCode = 400;
      return result;
    }

    // Mismatch gives error
    if (profileGraph[DatabusUris.JSONLD_ID] != profileUri) {
      result.message = `The specified uri of the foaf:PersonalProfileDocument graph does not match the expected value. (specified: ${profileGraph['@id']}, expected: ${profileUri})\n`;
      result.statusCode = 400;
      return result;
    }

    var pkeyPEM = fs.readFileSync(__dirname + '/../../../keypair/public-key.pem', 'utf-8');
    var publicKeyInfo = pem2jwk(pkeyPEM);
    let buff = Buffer.from(publicKeyInfo.n, 'base64');
    var modulus = buff.toString('hex');

    var rsaKeyGraph = {};
    rsaKeyGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.CERT_RSA_PUBLIC_KEY;
    rsaKeyGraph[DatabusUris.RDFS_LABEL] = DatabusConstants.WEBID_SHARED_PUBLIC_KEY_LABEL;
    rsaKeyGraph[DatabusUris.CERT_MODULUS] = modulus;
    rsaKeyGraph[DatabusUris.CERT_EXPONENT] = 65537;

    personGraph[DatabusUris.CERT_KEY] = [rsaKeyGraph];


    var insertGraphs = expandedGraphs;
    var compactedGraph = await jsonld.compact(insertGraphs, defaultContext);

    if (process.env.DATABUS_CONTEXT_URL != null) {
      compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
    }

    var targetPath = Constants.DATABUS_FILE_WEBID;


    var exists = await accountExists(accountName);

    

    // Save the data using the database manager
    var saveResult = await GstoreHelper.save(accountName, targetPath, compactedGraph);

    if (!saveResult.isSuccess) {
      // return with Forbidden
      result.message = 'Internal database error.\n';
      result.statusCode = 500;
      return result;
    }

    if(process.send != undefined) {
      process.send({
        id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
        resources : accountUri
      });
    }

    result.isSuccess = true;
    result.statusCode = exists ? 200 : 201;
    result.message = 'Account saved successfully.\n';
    return result;

  } catch (err) {
    // return 500 with error
    console.log('User creation failed!');
    console.log(err);
    result.message = err;
    result.statusCode = 500;
    return result;
  }
}
  */