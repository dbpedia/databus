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

  console.log(`Writing client environment variables`);

  // Write environment variables to client constants
  var constantsFile = './../public/js/utils/databus-constants.js';

  var regex = new RegExp(/DATABUS_RESOURCE_BASE_URL\s=\s"(.*)";/gm);
  var clientConstants = fs.readFileSync(constantsFile, ['utf8']).toString();

  clientConstants = clientConstants.replace(regex,
    `DATABUS_RESOURCE_BASE_URL = "${process.env.DATABUS_RESOURCE_BASE_URL}";`);

  regex = new RegExp(/DATABUS_DEFAULT_CONTEXT_URL\s=\s"(.*)";/gm);
  clientConstants = clientConstants.replace(regex,
    `DATABUS_DEFAULT_CONTEXT_URL = "${process.env.DATABUS_DEFAULT_CONTEXT_URL}";`);

  fs.writeFileSync(constantsFile, clientConstants, ['utf8']);
}

async function minifyClientJS() {
  await minifier.minify('../../public/js', 'js', '../min/databus.min.js', '../min/databus.min.js.map');
}

function tryCreateKeyPair() {

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

module.exports = async function () {
  writeClientVariables();
  await minifyClientJS();
  tryCreateKeyPair();
}