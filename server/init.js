// External includes
var fs = require('fs');
var rp = require('request-promise');
const crypto = require("crypto");
const Constants = require('./app/common/constants.js');
var config = require('./config.json');
const DatabusUserDatabase = require('./userdb.js');
const DatabusConstants = require('../public/js/utils/databus-constants.js');
const UriUtils = require('./app/common/utils/uri-utils.js');
const { executeAsk } = require('./app/common/execute-query.js');
const publishAccount = require('./app/api/lib/publish-account.js');
const AppJsonFormatter = require('../public/js/utils/app-json-formatter.js');


function writeManifest() {

  console.log(`Writing manifest...`);

  // Write environment variables to client constants
  var manifestFile = './manifest.ttl';

  var manifest = require('./manifest-template.ttl');

  var placeholderMappings = {
    DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
    DATABUS_VERSION: config.version
  };


  for (var placeholder in placeholderMappings) {
    var re = new RegExp('%' + placeholder + '%', "g");
    manifest = manifest.replace(re, placeholderMappings[placeholder]);
  }

  console.log('');
  console.log('\x1b[36m%s\x1b[0m', `================= MANIFEST =====================`);
  console.log('');
  console.log('\x1b[36m%s\x1b[0m', manifest);
  console.log('\x1b[36m%s\x1b[0m', `================================================`);
  console.log('');

  fs.writeFileSync(manifestFile, manifest, ['utf8']);

}

function tryCreateKeyPair() {

  console.log(`Creating or loading PEM key-pair...`);

  // Create RSA key paths
  var privateKeyFile = __dirname + '/keypair/private-key.pem';
  var publicKeyFile = __dirname + '/keypair/public-key.pem';

  // Make a new keypair if not existing
  if (!fs.existsSync(privateKeyFile)) {

    var { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      'modulusLength': 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    if (!fs.existsSync(__dirname + '/keypair')) {
      fs.mkdirSync(__dirname + '/keypair');
    }

    fs.writeFileSync(privateKeyFile, privateKey.toString('base64'), "utf8");
    fs.writeFileSync(publicKeyFile, publicKey.toString('base64'), "utf8");
  }

  console.log(`Using public key at ${publicKeyFile}:`);
  console.log(fs.readFileSync(publicKeyFile, "utf8"));
}

async function initializeShacl() {

  var shaclFiles = [
    'account', 'artifact', 'collection', 'dataid', 'group'
  ];

  for(var file of shaclFiles) {
    var shacl = require(`../model/generated/shacl/${file}.shacl`);
    var shaclFile = `${__dirname}/app/common/res/shacl/${file}.shacl`;

    console.log(`Creating SHACL resource }/app/common/res/shacl/${file}.shacl`);
    fs.writeFileSync(shaclFile, shacl, "utf8");
  }
}

async function initializeContext() {

  // Load the internal default context
  var context = require('../model/generated/context.json');
  var hasContext = false;

  // If configured, try to use it
  if (process.env.DATABUS_DEFAULT_CONTEXT_URL != undefined) {

    // Use the context URL specified as env variable
    var contextUrl = process.env.DATABUS_DEFAULT_CONTEXT_URL;

    console.log(`Loading default jsonld context from ${contextUrl}...`);

    try {
      // Request options
      var contextOptions = {
        method: 'GET',
        uri: contextUrl,
        headers: { 'User-Agent': 'Request-Promise' },
        json: true
      };

      // Request and save to file
      context = await rp(contextOptions);
      process.env.DATABUS_CONTEXT_URL = contextUrl;
      hasContext = true;

    } catch (err) {
      console.log(err);
      console.error(`Failed to fetch default context from ${contextUrl}`);
    }
  }
  
  if(process.env.DATABUS_DEFAULT_CONTEXT_URL == undefined || !hasContext) {
    
    var defaultContextUrl = `${process.env.DATABUS_RESOURCE_BASE_URL}${Constants.DATABUS_DEFAULT_CONTEXT_PATH}`
    
    console.log(`Using self-hosted jsonld context at ${defaultContextUrl}...`);
    process.env.DATABUS_CONTEXT_URL = defaultContextUrl;
  }

  // Set file path
  var contextFile = __dirname + '/app/common/res/context.jsonld';
  var contextString = JSON.stringify(context, null, 3);

  console.log(``);
  console.log('\x1b[36m%s\x1b[0m', `================== CONTEXT =====================`);
  console.log('\x1b[36m%s\x1b[0m', contextString);
  console.log('\x1b[36m%s\x1b[0m', `================================================`);

  console.log(``);
  fs.writeFileSync(contextFile, contextString, "utf8");
  console.log(`Successfully saved context to ${contextFile}:`);
}

async function initializeUserDatabase() {
  console.log(`Connecting to User Databse...`);
  var userDatabase = new DatabusUserDatabase();
  await userDatabase.connect();

  console.log(`Verifying user account integrity`);

  for(var user of await userDatabase.getUsers()) {
    var profileUri = `${UriUtils.createResourceUri([user.accountName])}${DatabusConstants.WEBID_DOCUMENT}`;
    var exists = await executeAsk(`ASK { <${profileUri}> ?p ?o }`);

    if (!exists) {
      // Redirect to the specific account page
      console.log(`No profile found for user ${user.accountName}. Creating profile...`);
     
      var accountJsonLd = AppJsonFormatter.createAccountData(
        process.env.DATABUS_RESOURCE_BASE_URL, 
        user.accountName,
        user.accountName, 
        null, 
        null);

      await publishAccount(user.accountName, accountJsonLd);

      console.log(`Created new default profile for user ${user.accountName}`);
    } 
  }

}


module.exports = async function () {

  console.log(`Initializing...`);
  console.log(config);

  await initializeUserDatabase();

  await initializeShacl();
  await initializeContext();

  writeManifest();

  tryCreateKeyPair();
  console.log(`Done initializing.`);
  console.log(`================================================`);


}