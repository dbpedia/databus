// This is the main application

// External includes
var bodyParser = require("body-parser");
var path = require('path');
var express = require('express');
var favicon = require('serve-favicon')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const ServerUtils = require('./common/utils/server-utils');
const webdav = require('webdav-server').v2;
const DatabusUtils = require("../../public/js/utils/databus-utils");
var config = require("../config.json");
const DatabusWebDAV = require("./api/webdav");
var DatabusProtect = require('./common/protect/middleware');
var serveIndex = require('serve-index');
var cors = require('cors');
const JsonldLoader = require("./common/utils/jsonld-loader");
const handle404 = require('./common/404');

// Create the main Express application instance
var app = express();

// Load the JSON-LD context and stringify it with indentation for readability
var context = JSON.stringify(require('../app/common/res/context.jsonld'), null, 3);

// Determine banner color from environment variable or fallback to config default
var bannerColor = DatabusUtils.stringOrFallback(process.env.DATABUS_BANNER_COLOR, config.defaultColors.banner);

// Set global app variables accessible in views and throughout the application
app.locals = {
  databus: {
    version: config.version,
    colors: {
      banner: bannerColor
    },
    name: process.env.DATABUS_NAME,
    abstract: process.env.DATABUS_ABSTRACT,
    iconUrl: process.env.DATABUS_ORG_ICON,
    contextUrl: process.env.DATABUS_CONTEXT_URL,
    context: context,
    defaultContextUrl: process.env.DATABUS_DEFAULT_CONTEXT_URL,
    resourceBaseUrl: process.env.DATABUS_RESOURCE_BASE_URL
  },
  author: {
    name: 'Jan Forberg',
    contact: 'forberg@infai.org'
  }
};

// Create an in-memory session store to hold session data
var memoryStore = new session.MemoryStore();

// Initialize the custom protection middleware with the session store
// All authentication and user data fetching happens in DatabusProtect
var protector = new DatabusProtect(memoryStore);

// Initialize the Databus WebDAV server module
var webDAVModule = new DatabusWebDAV();

// Call the initialization function and configure routes upon completion
initialize(app, memoryStore).then(function () {

  try {
    // Register the WebDAV route, protected with SSO and authentication middleware
    app.use('/dav', protector.checkSso(), webDAVModule.davAuth(),
      webdav.extensions.express('/', webDAVModule.webDAVServer));

    // Serve the site favicon
    app.use(favicon(path.join(__dirname, '../../public/img', 'favicon.ico')));

    // Create a new Express router for routing requests
    // router is the root object that all HTTP routes are attached to
    var router = new express.Router();

    // Apply authentication middleware globally
    app.use(protector.auth());

    // Enable private mode protection if specified in environment variables
    if (process.env.DATABUS_PRIVATE_MODE == "true") {
      console.log(`Started cluster node in private mode`);
      app.all('/{*path}', protector.protect(true, function (req, res) {
        protector.sendError(req, res, 401, 'Unauthorized', "This Databus is private. Please log in.");
      }));
    }

    // Load API route module and attach routes to the router
    // Code for the API server is located in the ./api folder
    require('./api/module')(router, protector, app.locals); 

    // Load page-rendering route module and attach to the same router
    // Code for the HTML webapp is located in the ./webapp folder
    require('./webapp/module')(router, protector);

    // Attach the configured router to the main app
    app.use('/', router);

    // Handle 404 - resource not found
    app.use(protector.checkSso(), handle404);

  } catch (err) {
    // Log any errors that occur during initialization
    console.log(err);
  }
});

/**
 * Initializes the Express application with middleware and configuration
 * @param {object} app - The Express app instance
 * @param {object} memoryStore - The session memory store
 */
async function initialize(app, memoryStore) {

  // Initialize JSON-LD context loader used for linked data parsing
  JsonldLoader.initialize();
  
  try {
    // Enable trust proxy so Express knows it's behind a reverse proxy (e.g. nginx)
    app.set('trust proxy', true);

    // Configure body parsing for form data and JSON, with large request limits
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    app.use(bodyParser.json({ limit: '50mb', type: ['application/json', 'application/ld+json'] }));

    // Set view engine and templates directory for rendering dynamic HTML
    app.set('views', path.join(__dirname, '../../public/templates'));
    app.set('view engine', 'ejs');

    // Use logging middleware for HTTP request logging
    app.use(logger('dev'));

    // Add built-in body parsers for JSON and URL-encoded data
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Add cookie parsing middleware
    app.use(cookieParser());

    // Serve static assets from the public directory (e.g., CSS, JS, images)
    app.use(express.static(path.join(__dirname, '../../public')));

    // Set up session management using in-memory store and a hardcoded secret
    app.use(session({
      secret: 'asdifjasdf8asewj2aef23jdlkjs',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }));

    // Define the path to the local resource directory (SHACL, JSON-LD files, etc.)
    var resourceDirectory = `${__dirname}/common/res/`;
    console.log(resourceDirectory);

    // Serve files in the /res route with CORS enabled and proper content-type headers
    app.use('/res', cors(), express.static(resourceDirectory, {
      setHeaders : function(res, path, stat) {
        if(path.endsWith('.shacl')) {
          res.setHeader('Content-Type', 'text/turtle');
        }
        if(path.endsWith('.jsonld')) {
          res.setHeader('Content-Type', 'application/ld+json');
        }
      }
    }),
    // Enable directory listing for /res with a custom stylesheet
    serveIndex(resourceDirectory, {
      stylesheet: `${__dirname}/../../public/css/serve-index.css`
    }));

  } catch (err) {
    // Log initialization errors
    console.log(err);
  }
}

// Export the configured app instance for use in other modules
module.exports = app;
