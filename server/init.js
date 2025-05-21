// External includes
var fs = require('fs');
const crypto = require("crypto");
const Constants = require('./app/common/constants.js');
var config = require('./config.json');
const DatabusUserDatabase = require('./userdb.js');
const MetricsManager = require('./app/api/statistics/metrics-manager.js');
const JsonldLoader = require('./app/common/utils/jsonld-loader.js');

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
    'account', 'artifact', 'collection', 'version', 'group'
  ];

  for (var file of shaclFiles) {
    var shacl = require(`../model/generated/shacl/${file}.shacl`);
    var shaclFile = `${__dirname}/app/common/res/shacl/${file}.shacl`;

    console.log(`Creating SHACL resource /app/common/res/shacl/${file}.shacl`);
    fs.writeFileSync(shaclFile, shacl, "utf8");
  }
}

async function initializeContext() {

  var defaultContextUrl = `${process.env.DATABUS_RESOURCE_BASE_URL}${Constants.DATABUS_DEFAULT_CONTEXT_PATH}`

  console.log(`Using self-hosted jsonld context at ${defaultContextUrl}...`);
  process.env.DATABUS_CONTEXT_URL = defaultContextUrl;


  /*
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
  */
}

async function waitForService(url, maxAttempts = 10, delayMs = 1000) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Service is online at ${url} (attempt ${attempt})`);
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


async function initializeUserDatabase(indexer) {
  console.log(`Connecting to User Database...`);
  var userDatabase = new DatabusUserDatabase();
  await userDatabase.connect();
}


module.exports = async function (indexer) {

  console.log(`Initializing...`);
  console.log(config);


  console.log(`Waiting for gstore service...`);


  await initializeContext();


  // Ping process.env.DATABUS_DATABASE_URL
  // await waitForService(process.env.DATABUS_DATABASE_URL, 50, 1000);

  if (process.env.METRICS_PORT != undefined) {
    console.log(`Settings up Prometheus metrics...`);
    MetricsManager.initialize();
  }

  
  JsonldLoader.initialize();

  await initializeUserDatabase(indexer);

  // await initializeShacl();

  // initializeJsonLd();

  writeManifest();

  tryCreateKeyPair();
  console.log(`Done initializing.`);
  console.log(`================================================`);


}