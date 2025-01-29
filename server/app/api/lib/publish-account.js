const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
var GstoreHelper = require('../../common/utils/gstore-helper');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const Constants = require('../../common/constants');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');

var shaclTester = require('../../common/shacl-tester');
var jsonld = require('jsonld');
var fs = require('fs');
const pem2jwk = require('pem-jwk').pem2jwk;
const exec = require('../../common/execute-query');

const defaultContext = require('../../common/res/context.jsonld');

var constructor = require('../../common/execute-construct.js');
var constructAccountQuery = require('../../common/queries/constructs/construct-account.sparql');
const UriUtils = require('../../common/utils/uri-utils');
const DatabusMessage = require('../../common/databus-message');


async function accountExists(accountName) {
  let accountUri = UriUtils.createResourceUri([accountName]);
  return await exec.executeAsk(`ASK { ?s <${DatabusUris.FOAF_ACCOUNT}> <${accountUri}> . }`);
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

    // Validate the group RDF with the shacl validation tool
    var shaclResult = await shaclTester.validateWebIdRDF(body);

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