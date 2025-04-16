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
const DatabusWebDAV = require("./webdav");
var DatabusProtect = require('./common/protect/middleware');
var serveIndex = require('serve-index');
var cors = require('cors');
const Constants = require("./common/constants");
const defaultContext  = require("./common/res/context.jsonld");
const jsonld = require('jsonld');
const axios = require('axios');
const JsonldLoader = require("./common/utils/jsonld-loader");

// Creation of the mighty server app
var app = express();

var context = JSON.stringify(require('../app/common/res/context.jsonld'), null, 3);
var titleColor = DatabusUtils.stringOrFallback(process.env.DATABUS_TITLE_COLOR, config.defaultColors.title);
var bannerColor = DatabusUtils.stringOrFallback(process.env.DATABUS_BANNER_COLOR, config.defaultColors.banner);

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

// Create a session memory store (server cache)
var memoryStore = new session.MemoryStore();
var protector = new DatabusProtect(memoryStore);
var webDAVModule = new DatabusWebDAV();

// Initialize the express app
initialize(app, memoryStore).then(function () {

  try {
    // Add webDAV
    app.use('/dav', protector.checkSso(), webDAVModule.davAuth(),
      webdav.extensions.express('/', webDAVModule.webDAVServer));

    // Fav Icon
    app.use(favicon(path.join(__dirname, '../../public/img', 'favicon.ico')));

    var router = new express.Router();

    // Use protection
    app.use(protector.auth());

    if (process.env.DATABUS_PRIVATE_MODE == "true") {
      console.log(`Started cluster node in private mode`);
      app.all('*', protector.protect(true, function (req, res) {

        protector.sendError(req, res, 401, 'Unauthorized', "This Databus is private. Please log in.");
        
        /*
        if (protector.isBrowserRequest(req)) {
          var data = {}
          data.auth = ServerUtils.getAuthInfoFromRequest(req);
          res.status(401).render('unauthorized', {
            title: 'Unauthorized',
            data: data,
          });
        } else {
          res.status(401).send();
        }*/
      }));
    }



    // Attach modules to router
    require('./api/module')(router, protector, app.locals); // API handlers
    require('./pages/module')(router, protector);// Web App handlers


    // Attach router
    app.use('/', router);

    // Handle 404
    app.use(protector.checkSso(), function (req, res, next) {
      res.status(404);

      // respond with html page
      if (req.accepts('html')) {
        var data = {}
        data.auth = ServerUtils.getAuthInfoFromRequest(req);
        res.render('404', { title: 'Not found', data: data });
        return;
      }

      // respond with json
      if (req.accepts('json')) {
        res.json({ error: 'Not found', message: "The requested resource could not be found." });
        return;
      }

      // default to plain-text. send()
      res.type('txt').send('The requested resource could not be found.\n');
    });

  } catch (err) {
    console.log(err);
  }


});

/**
 * Express app initialization
 * @param {the express app} app 
 */
async function initialize(app, memoryStore) {

  JsonldLoader.initialize();
  
  try {
    app.set('trust proxy', true);
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    app.use(bodyParser.json({ limit: '50mb', type: ['application/json', 'application/ld+json'] }));

    // view engine setup
    app.set('views', path.join(__dirname, '../../public/templates'));
    app.set('view engine', 'ejs');
    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../../public')));

    app.use(logger('dev'));
    // Setup the session memory store
    app.use(session({
      secret: 'asdifjasdf8asewj2aef23jdlkjs',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }));

    var resourceDirectory = `${__dirname}/common/res/`;
    console.log(resourceDirectory);

    // Serve jsonld and shacl resources in the resource directory
    app.use('/res', cors(), express.static(resourceDirectory, {
      setHeaders : function(res, path, stat) {

        if(path.endsWith('.shacl')) {
          res.setHeader('Content-Type', 'text/turtle');
        }

        if(path.endsWith('.jsonld')) {
          res.setHeader('Content-Type', 'application/ld+json');
        }
      }
    }), serveIndex(resourceDirectory, {
      stylesheet: `${__dirname}/../../public/css/serve-index.css`
    }));

  } catch (err) {
    console.log(err);
  }
}

module.exports = app;
