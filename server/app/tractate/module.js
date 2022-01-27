
var suite = require('./databus-tractate-suite');
var jsonld = require('jsonld');
var JsonldUtils = require('../common/utils/jsonld-utils');
const Constants = require('../common/constants');
var defaultContext = require('../common/context.json');
const DatabusUris = require('../../../public/js/utils/databus-uris');

module.exports = function (router, protector) {

  require('../pages/file-analyzer')(router, protector);

  router.post('/system/tractate/v1/canonicalize', protector.checkSso(), async function (req, res, next) {

    try {
      // Find context:
      var graph = req.body;

      // Replace if default context
      if (graph['@context'] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var canonicalizedForm = await suite.expandAndCanonicalize(graph);
      console.log(`\x1b[32m${canonicalizedForm}\x1b[0m`);
      res.status(200).send(canonicalizedForm);

    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry cant find that!');
    }

  });

  router.post('system/tractate/v1/verify', protector.protect(), async function (req, res, next) {

    try {

      // Find context:
      var graph = req.body;

      // Replace if default context
      if (graph['@context'] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var expandedGraph = await jsonld.flatten(await jsonld.expand(graph));

      // Get the proof graph 
      var proofGraph = JsonldUtils.getTypedGraph(expandedGraph, DatabusUris.DATABUS_TRACTATE_V1);

      // Create the canonicalized form
      var canonicalizedForm = suite.canonicalize(expandedGraph);

      // Verify
      var validationSuccess = await suite.validate(canonicalizedForm, proofGraph);

      if (!validationSuccess) {
        res.status(400).send(`The signature is invalid\n`);
        return;
      }

      res.status(200).send(`Verification successful.\n`);

    } catch (err) {
      res.status(500).send(err);
    }

  });


}