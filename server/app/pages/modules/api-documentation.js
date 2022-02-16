const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');


var options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customJs: '/js/utils/swagger-page.js'
};


var header = `
<nav id="navbar" style="
color: #4a4a4a;
font-size: 1em;
font-weight: 400;
font-family: 'PT Sans', sans-serif;
line-height: 1.5em;
position: relative;
align-items: stretch;
display: flex;
min-height: 3.25rem;
z-index: 1000;
background-color: #343a40;">
  <div style="
  flex-grow: 1;
  margin: 0 auto;
  position: relative;
  max-width: 1344px;
  align-items: stretch;
  display: flex;
  min-height: 3.25rem;
  width: 100%;">
    <div style="align-items: stretch;
    display: flex;
    flex-shrink: 0;
    min-height: 3.25rem;
    margin-left: -0.75rem;">
      <a href="/" style="display:flex">
        <svg class="navbar-item" style="padding: 0.5rem 0.75rem; margin:10px" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" height="15mm" viewBox="0 0 40.326191 46.198502" version="1.1" id="svg5">
          <defs id="defs2"></defs>
          <g id="layer1" transform="translate(-0.76641155,-0.7702354)">
            <path id="path42117" style="fill:#fff;;stroke:none;stroke-width:0.524959px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 0.76949155,0.7702454 v 5.24959 l 29.33129045,-10e-4 6.27262,8.8675006 -0.002,32.0824 4.7212,-0.002 V 0.7702354 Z m 18.43511045,8.3952603 -5.68354,0.006 7.1979,10.5484003 -0.004,27.24663 4.70393,-0.002 0.0167,-28.60108 z m -9.4730904,0.002 -8.96510005,0.002 0.004,37.7960503 16.79563045,-0.004 0.001,-26.29103 z m 13.2512904,0 5.59825,8.2188903 -0.0396,29.57614 4.70307,-0.002 0.006,-31.09587 -4.55858,-6.6940403 z"></path>
          </g>
        </svg>
      </a>
    </div>
  </div>
</nav>`

module.exports = function (router, protector) {

  var swaggerYaml = fs.readFileSync(__dirname + '/../swagger.yml', ['utf8']).toString();

  swaggerYaml = swaggerYaml
    .replace(/%DATABUS_RESOURCE_BASE_URL%/g, process.env.DATABUS_RESOURCE_BASE_URL);

  var swaggerDocument = YAML.parse(swaggerYaml);

  // Hack in the header!
  function hackTheHeader(req, res, next) {

    if (req.url == '/') {

      var write = res.send;
      res.send = function (chunk) {

        chunk instanceof Buffer && (chunk = chunk.toString());
        chunk = chunk
          .replace(`<body>`, `<body>${header}`);

        res.setHeader('Content-Length', chunk.length);
        write.apply(this, arguments);
      };
    }

    next();
  }

  router.use('/api', hackTheHeader, swaggerUi.serve);
  router.get('/api', swaggerUi.setup(swaggerDocument, options));


}
