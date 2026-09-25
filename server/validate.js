// External includes
const Constants = require('./app/common/constants.js');
const DatabusUserDatabase = require('./userdb.js');
const DatabusConstants = require('../public/js/utils/databus-constants.js');
const UriUtils = require('./app/common/utils/uri-utils.js');
const { executeAsk, executeSelect } = require('./app/common/execute-query.js');
const AppJsonFormatter = require('../public/js/utils/app-json-formatter.js');
const AccountWriter = require('./app/api/lib/account-writer.js');
const DatabusLogger = require('./app/common/databus-logger.js');
const DatabusLogLevel = require('./app/common/databus-log-level.js');
const DatabusUris = require('../public/js/utils/databus-uris.js');
const GstoreResource = require('./app/api/lib/gstore-resource.js');
const AccountUtils = require('./app/common/utils/account-utils.js');


async function verifyAccountIntegrity(indexer) {

  console.log(`Verifying user account integrity`);
  var userDatabase = new DatabusUserDatabase();
  await userDatabase.connect();

  for (var account of await userDatabase.getAllAccounts()) {

    try {
      var accountUri = `${UriUtils.createResourceUri([account.accountName])}`;
      var exists = await executeAsk(`ASK { <${accountUri}> ?p ?o }`);
      
      if (!exists) {
        // Redirect to the specific account page
        console.log(`No account found for user ${account.accountName}. Creating account...`);
        var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account.accountName}`;
        
        var personUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${account.accountName}${DatabusConstants.WEBID_THIS}`;
        
        var hasPerson = await executeAsk(`ASK { <${personUri}> ?p ?o }`);

        let accountLabel = account.accountName;
        let accountImg = null;

        if(hasPerson) {
          let personInfo = await executeSelect(`SELECT DISTINCT * WHERE { <${personUri}> ?p ?o . }`);

          for(let info of personInfo) {

            if(info.p == DatabusUris.FOAF_NAME) {
              accountLabel = info.o;
            }

            if(info.p == DatabusUris.FOAF_IMG) {
              accountImg = info.o;
            }
          }
        }

        console.log(`Creating account { name: ${account.accountName}, label: ${accountLabel}, img: ${accountImg} }`);
        var accountJsonLd = await AccountUtils.createAccountGraphs(
          accountUri, account.accountName, accountLabel, accountImg, null, null);

        
        let gstoreResource = new GstoreResource(accountUri, accountJsonLd);
        await gstoreResource.save();

        indexer.updateResource(accountUri, 'Account');
        console.log(`Created new default account for user ${account.accountName}`);
      }
    } catch(err) {
        console.log(`Failed to create new default account for user ${account.accountName}`);
    }
  }
}

async function waitForService(url, maxAttempts = 10, delayMs = 1000) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      // Could log or ignore depending on use case
    }

    console.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
    await delay(delayMs);
  }

  console.error(`Service at ${url} did not come online after ${maxAttempts} attempts.`);
  return false;
}

module.exports = async function (indexer) {

  try {

    console.log("================================================");
    
    console.log(`Waiting for context...`);
    var defaultContextUrl = `${process.env.DATABUS_RESOURCE_BASE_URL}${Constants.DATABUS_DEFAULT_CONTEXT_PATH}`
    await waitForService(defaultContextUrl, 10, 1000);

    // console.log(`Context available at ${defaultContextUrl}`);
    await verifyAccountIntegrity(indexer);

    // TODO: Check availability of manifest

    console.log(`Databus is running!...`);
  }
  catch(error) {
    console.log(`There was an issue during Databus startup!`);
    console.log(error);
  }
}