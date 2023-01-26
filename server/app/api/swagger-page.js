const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');

const databusHeaderTemplate = require('../../../public/templates/header.ejs');
const ejs = require('ejs');
const ServerUtils = require('../common/utils/server-utils');

var options = {
  customCss: '.swagger-ui .topbar { display: none }',
};


module.exports = function (router, protector, locals) {

  var swaggerYaml = fs.readFileSync(__dirname + '/swagger.yml', ['utf8']).toString();
  var swaggerCss = `<link rel="stylesheet" type="text/css" href="./swagger-ui.css">`;
  var customJs = fs.readFileSync(__dirname + '/swagger-client.js', ['utf8']).toString();

  var opts = JSON.parse(JSON.stringify(locals));
  opts.title = "API Documentation";
  opts.data = {};

 
  swaggerYaml = swaggerYaml
    .replace(/%DATABUS_RESOURCE_BASE_URL%/g, process.env.DATABUS_RESOURCE_BASE_URL);

  var swaggerDocument = YAML.parse(swaggerYaml);

  // Hack in the header!
  function hackTheHeader(req, res, next) {

    if (req.url == '/') {

      opts.data.auth = ServerUtils.getAuthInfoFromRequest(req);
      var databusHeader = ejs.render(databusHeaderTemplate, opts);

      var write = res.send;
      res.send = function (chunk) {

        chunk instanceof Buffer && (chunk = chunk.toString());

        var index = chunk.indexOf("<body>");
        chunk = databusHeader + chunk.substr(index + 6);
        chunk = chunk.replace(`<head>`, `<head>${swaggerCss}`);
        chunk = chunk.replace(`</body>`, `<script>${customJs}</script></body>`);
        
        res.setHeader('Content-Length', chunk.length);
        write.apply(this, arguments);
      };
    }

    next();
  }

  router.use('/api', protector.checkSso(), hackTheHeader, swaggerUi.serve);
  router.get('/api', swaggerUi.setup(swaggerDocument, options));


}
