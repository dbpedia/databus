// External includes
const Constants = require('./app/common/constants.js');
const DatabusUserDatabase = require('./userdb.js');
const DatabusConstants = require('../public/js/utils/databus-constants.js');
const UriUtils = require('./app/common/utils/uri-utils.js');
const { executeAsk } = require('./app/common/execute-query.js');
const AppJsonFormatter = require('../public/js/utils/app-json-formatter.js');
const AccountWriter = require('./app/api/lib/account-writer.js');
const DatabusLogger = require('./app/common/databus-logger.js');
const DatabusLogLevel = require('./app/common/databus-log-level.js');


async function verifyAccountIntegrity(indexer) {

  console.log(`Verifying user account integrity`);
  var userDatabase = new DatabusUserDatabase();
  await userDatabase.connect();

  for (var user of await userDatabase.getAllUsers()) {
    var profileUri = `${UriUtils.createResourceUri([user.accountName])}${DatabusConstants.WEBID_DOCUMENT}`;
    var exists = await executeAsk(`ASK { <${profileUri}> ?p ?o }`);

    if (!exists) {
      // Redirect to the specific account page
      console.log(`No profile found for user ${user.accountName}. Creating profile...`);

      var userData = {
        accountName: user.accountName,
        sub: user.sub
      };

      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${user.accountName}`;

      var accountJsonLd = AppJsonFormatter.createAccountData(
        accountUri,
        user.accountName,
        null,
        null);

      
      var accountWriter = new AccountWriter(null, new DatabusLogger(DatabusLogLevel.ERROR));
      await accountWriter.writeResource(userData, accountJsonLd, accountUri);
      // await publishAccount(user.accountName, accountJsonLd);

      indexer.updateResource(accountWriter.uri, accountWriter.resource.getTypeName());
      console.log(`Created new default profile for user ${user.accountName}`);
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