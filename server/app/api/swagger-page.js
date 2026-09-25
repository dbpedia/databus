const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const ejs = require('ejs');
const ServerUtils = require('../common/utils/server-utils');

const databusHeaderTemplate = require('../../../public/templates/header.ejs');

const options = {
  customCss: `
    .swagger-ui .topbar { display: none !important; }
    .renderedMarkdown ul {
      list-style: disc;
      margin-left: 2em;
    }
  `
};

module.exports = function(router, protector, locals) {
  const swaggerYaml = fs.readFileSync(__dirname + '/swagger.yml', 'utf8');
  const swaggerDocument = YAML.parse(
    swaggerYaml.replace(/%DATABUS_RESOURCE_BASE_URL%/g, process.env.DATABUS_RESOURCE_BASE_URL)
  );
  swaggerDocument.info.version = require('../../version');

  const swaggerCss = `<link rel="stylesheet" type="text/css" href="./swagger-ui.css">`;
  const customJs = fs.readFileSync(__dirname + '/swagger-client.js', 'utf8').toString();

  const data = JSON.parse(JSON.stringify(locals));
  data.title = 'API Documentation';
  data.data = {};

  const opts = { views: ['./../public/templates'] };

  function hackTheHeader(req, res, next) {
    if (req.url === '/') {
      data.data.auth = ServerUtils.getAuthInfoFromRequest(req);
      opts.title = 'API Documentation';
      const databusHeader = ejs.render(databusHeaderTemplate, data, opts);

      const write = res.send;
      res.send = function(chunk) {
        chunk = chunk instanceof Buffer ? chunk.toString() : chunk;

        const index = chunk.indexOf('<body>');
        if (index !== -1) chunk = databusHeader + chunk.substr(index + 6);

        // Dynamic replacement values for placeholders
        const swaggerOptions = {
          swaggerUrl: process.env.SWAGGER_BASE_URL || '',
          swaggerDoc: swaggerDocument,
          swaggerUrls: null,
          customOptions: {},
          replacements: {
            GROUP: process.env.DEFAULT_GROUP || 'test_group',
            ARTIFACT: process.env.DEFAULT_ARTIFACT || 'test_artifact',
            VERSION: process.env.DEFAULT_VERSION || '2022-02-09'
          }
        };

        const injectScript = `
          <script>
            window.swaggerDynamicOptions = {
              templateOptions: ${JSON.stringify(swaggerOptions)}
            };
          </script>
          <script>${customJs}</script>
        `;

        chunk = chunk.replace('<head>', `<head>${swaggerCss}`);
        chunk = chunk.replace('</body>', `${injectScript}</body>`);

        res.setHeader('Content-Length', Buffer.byteLength(chunk));
        write.call(this, chunk);
      };
    }
    next();
  }

  router.use('/api', protector.checkSso(), hackTheHeader, swaggerUi.serve);
  router.get('/api', swaggerUi.setup(swaggerDocument, options));
};
