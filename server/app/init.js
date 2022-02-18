// External includes
var createError = require('http-errors');
var path = require('path');
var logger = require('morgan');
var fs = require('fs');
var minifier = require("./minifier.js");
var rp = require('request-promise');
const crypto = require("crypto");
const Constants = require('./common/constants.js');

function writeClientVariables() {

  console.log(`Writing client environment variables...`);

  // Write environment variables to client constants
  var constantsFile = './../public/js/utils/databus-constants.js';
  var content = fs.readFileSync(constantsFile, ['utf8']).toString();

  content = writeConstant(content, `DATABUS_RESOURCE_BASE_URL`, process.env.DATABUS_RESOURCE_BASE_URL);
  content = writeConstant(content, `DATABUS_DEFAULT_CONTEXT_URL`, Constants.DATABUS_DEFAULT_CONTEXT_URL);
  content = writeConstant(content, `DATABUS_NAME`, process.env.DATABUS_NAME);
 
  fs.writeFileSync(constantsFile, content, ['utf8']);
}

function writeConstant(string, key, value) {
  var regex = new RegExp(`${key}\\s=\\s"(.*)";`, `gm`);
  
  return string.replace(regex,
    `${key} = "${value}";`);
}

function writeManifest() {

  console.log(`Writing manifest...`);

  // Write environment variables to client constants
  var manifestFile = './manifest.ttl';

  var manifest = require('./manifest-template.ttl');

  var placeholderMappings = {
    DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL
  };

  for (var placeholder in placeholderMappings) {
    var re = new RegExp('%' + placeholder + '%', "g");
    manifest = manifest.replace(re, placeholderMappings[placeholder]);
  }

  fs.writeFileSync(manifestFile, manifest, ['utf8']);

}

async function minifyClientJS() {
  console.log(`Minifying client-side javascript...`);
  await minifier.minify('../../public/js', 'js', '../min/databus.min.js', '../min/databus.min.js.map');
}

function tryCreateKeyPair() {

  console.log(`Creating or loading PEM key-pair...`);

  // Create RSA key paths
  var privateKeyFile = __dirname + '/../keypair/private-key.pem';
  var publicKeyFile = __dirname + '/../keypair/public-key.pem';

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

    if (!fs.existsSync(__dirname + '/../keypair')) {
      fs.mkdirSync(__dirname + '/../keypair');
    }

    fs.writeFileSync(privateKeyFile, privateKey.toString('base64'), "utf8");
    fs.writeFileSync(publicKeyFile, publicKey.toString('base64'), "utf8");
  }
}

async function loadDefaultContext() {

  try {
    // Overwrite default if configured
    if (process.env.DATABUS_DEFAULT_CONTEXT_URL == undefined) {
      process.env.DATABUS_DEFAULT_CONTEXT_URL = Constants.DATABUS_DEFAULT_CONTEXT_URL;
    }


    console.log(`Loading default context from ${process.env.DATABUS_DEFAULT_CONTEXT_URL}...`);

    
    // Set file path
    var contextFile = __dirname + '/common/context.json';

    // Request options
    var contextOptions = {
      method: 'GET',
      uri: process.env.DATABUS_DEFAULT_CONTEXT_URL,
      headers: { 'User-Agent': 'Request-Promise' },
      json: true
    };

    // Request and save to file
    var response = await rp(contextOptions);
    fs.writeFileSync(contextFile, JSON.stringify(response), "utf8");

    
  } catch (err) {
    console.log(err);
    console.error(`Failed to fetch default context from ${process.env.DATABUS_DEFAULT_CONTEXT_URL}`);
  }


}

module.exports = async function () {
  console.log(`================================================`);
  console.log(`Initializing...`);
  await loadDefaultContext();
  writeClientVariables();
  writeManifest();
  await minifyClientJS();
  tryCreateKeyPair();
  console.log(`Done initializing.`);
  console.log(`================================================`);

}