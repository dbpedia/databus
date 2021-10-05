// This is the main application

// External includes
var createError = require('http-errors');
var express = require('express');
var favicon = require('serve-favicon')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var fs = require('fs');
var cors = require('cors');
var bodyParser = require("body-parser");
var minifier = require("./minifier.js");
const crypto = require("crypto");

// Creation of the mighty server app
var app = express();

// Create a session memory store (server cache)
var memoryStore = new session.MemoryStore();

// Initialize the express app
initialize(app, memoryStore);

// Create and attach the databus protector
var DatabusProtect = require('./protect/middleware');

var protector = new DatabusProtect(memoryStore);
var router = new express.Router();

app.use(favicon(path.join(__dirname, '../../public/img', 'favicon.ico')));

// Create modules
require('./collections/module')(router, protector);
require('./publish/module')(router, protector);
require('./accounts/module')(router, protector);
require('./pages/module')(router, protector);


app.use(protector.auth());
// Attach router
app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// TODO remove later
require('./tests')().then(function () {
  console.log('Tests run successfully.');
}, function (error) {
  console.log(error);
})


/**
 * Express app initialization
 * @param {the express app} app 
 */
function initialize(app, memoryStore) {

  // CORS setup
  var originsWhitelist = [
    'databus.dbpedia.org',
    'localhost:3000'
  ];

  var corsOptions = {
    origin: function (origin, callback) {
      var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
      callback(null, isWhitelisted);
    }
  }

  app.set('trust proxy', 'loopback');
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(cors(corsOptions));

  // add a sparql file loading extension (simply read the file as a string)
  require.extensions['.sparql'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };

  require.extensions['.md'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };
  require.extensions['.ttl'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };
  require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };

  // view engine setup
  app.set('views', path.join(__dirname, '../../public/templates'));
  app.set('view engine', 'ejs');
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../../public')));

  // Setup the session memory store
  app.use(session({
    secret: 'asdifjasdf8asewj2aef23jdlkjs',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }));

  // Write environment variables to client constants
  var constantsFile = './../public/js/utils/databus-constants.js';

  var regex = new RegExp(/DATABUS_RESOURCE_BASE_URL\s=\s"(.*)";/gm);
  var clientConstants = fs.readFileSync(constantsFile, ['utf8']).toString();
  clientConstants = clientConstants.replace(regex,
    `DATABUS_RESOURCE_BASE_URL = "${process.env.DATABUS_RESOURCE_BASE_URL}";`);

  fs.writeFileSync(constantsFile, clientConstants, ['utf8']);


  // Create RSA keys
  var privateKeyFile = __dirname + '/../keypair/private-key.pem';
  var publicKeyFile = __dirname + '/../keypair/public-key.pem';

  // try to load from file
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

  // TODO: enable minifier
  minifier.minify('../../public/js', 'js', '../min/databus.min.js', '../min/databus.min.js.map');
}

module.exports = app;
