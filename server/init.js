// External includes
var createError = require('http-errors');
var path = require('path');
var logger = require('morgan');
var fs = require('fs');
var minifier = require("./app/minifier.js");
var rp = require('request-promise');
const crypto = require("crypto");
const Constants = require('./app/common/constants.js');
var config = require('./config.json');
const DatabusUris = require('../public/js/utils/databus-uris.js');
const DatabusUserDatabase = require('./userdb.js');


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

async function minifyClientJS() {
  console.log(`Minifying client-side javascript...`);
  await minifier.minify('../../public/js', 'js', '../min/databus.min.js', '../min/databus.min.js.map');
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

async function initializeContext() {

  // Load the internal default context
  var context = require('../model/generated/context.json');

  // Overwrite default if configured
  if (process.env.DATABUS_DEFAULT_CONTEXT_URL == undefined) {
    process.env.DATABUS_DEFAULT_CONTEXT_URL = Constants.DATABUS_DEFAULT_CONTEXT_URL;
  }

  if (config.loadExternalJsonldContext) {

    // Use the context URL specified as env variable
    var contextUrl = process.env.DATABUS_DEFAULT_CONTEXT_URL;

    // If no env variable was specified, use the default context URL 
    // (https://downloads.dbpedia.org/databus/context.jsonld)
    if (contextUrl == null) {
      contextUrl = Constants.DATABUS_DEFAULT_CONTEXT_URL;
    }

    console.log(`Loading default context from ${contextUrl}...`);

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

    } catch (err) {
      console.log(err);
      console.error(`Failed to fetch default context from ${defaultContextUrl}`);
    }
  }

  // Set file path
  var contextFile = __dirname + '/app/common/context.json';
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
  var userDatabase = new DatabusUserDatabase();
  await userDatabase.connect();
}


module.exports = async function () {

  console.log(`Initializing...`);
  console.log(config);

  await initializeUserDatabase();

  await initializeContext();

  writeManifest();

  if (config.minifyJs) {
    await minifyClientJS();
  }

  tryCreateKeyPair();
  console.log(`Done initializing.`);
  console.log(`================================================`);


}