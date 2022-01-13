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
var rp = require('request-promise');
const crypto = require("crypto");
const Constants = require('./common/constants.js');



// Creation of the mighty server app
var app = express();

// Create a session memory store (server cache)
var memoryStore = new session.MemoryStore();

// Initialize the express app
initialize(app, memoryStore).then(function () {


  // Create and attach the databus protector
  var DatabusProtect = require('./protect/middleware');

  var protector = new DatabusProtect(memoryStore);
  var router = new express.Router();

  app.use(favicon(path.join(__dirname, '../../public/img', 'favicon.ico')));

  // Create modules
  require('./publish/module')(router, protector);
  require('./pages/module')(router, protector);
  require('./resources/module')(router, protector);
  require('./tractate/module')(router, protector);

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
});


async function loadDefaultContext() {

  try {

    // Overwrite default if configured
    if (process.env.DATABUS_DEFAULT_CONTEXT_URL != undefined) {
      Constants.DATABUS_DEFAULT_CONTEXT_URL = process.env.DATABUS_DEFAULT_CONTEXT_URL;
    }

    // Set file path
    var contextFile = __dirname + '/../../context.json';

    // Request options
    var contextOptions = {
      method: 'GET',
      uri: Constants.DATABUS_DEFAULT_CONTEXT_URL,
      headers: { 'User-Agent': 'Request-Promise' },
      json: true
    };

    // Request and save to file
    var response = await rp(contextOptions);
    fs.writeFileSync(contextFile, JSON.stringify(response), "utf8");

    console.log(`Fetched default context from ${Constants.DATABUS_DEFAULT_CONTEXT_URL}`);

  } catch (err) {
    console.log(err);
    console.log(`Failed to fetch default context from ${Constants.DATABUS_DEFAULT_CONTEXT_URL}`);
  }

  // TODO: REMOVE!!
  Constants.DATABUS_DEFAULT_CONTEXT_URL = 'https://downloads.dbpedia.org/databus/context.jsonld';

}

/**
 * Express app initialization
 * @param {the express app} app 
 */
async function initialize(app, memoryStore) {


  // CORS setup
  var originsWhitelist = [
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

  await loadDefaultContext();


}

module.exports = app;
