
var suite = require('../lib/databus-tractate-suite');
var jsonld = require('jsonld');
var JsonldUtils = require('../../common/utils/jsonld-utils');
const Constants = require('../../common/constants');
var defaultContext = require('../../../../model/generated/context.json');
const DatabusUris = require('../../../../public/js/utils/databus-uris');

module.exports = function (router, protector) {

  // require('../common/file-analyzer').route(router, protector);

  router.post('/api/tractate/v1/canonicalize', async function (req, res, next) {

    try {
      // Find context:
      var graph = req.body;

      // console.log(graph);

      // Replace if default context
      if (graph['@context'] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var canonicalizedForm = await suite.expandAndCanonicalize(graph);

      // console.log(`\x1b[32m${canonicalizedForm}\x1b[0m`);
      res.status(200).send(canonicalizedForm);

    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  });

  router.post('/api/tractate/v1/verify', async function (req, res, next) {

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
      var canonicalizedForm = await suite.expandAndCanonicalize(expandedGraph);

      // Verify
      var validationSuccess = await suite.validate(canonicalizedForm, proofGraph);

      var result = {
        success : validationSuccess,
        message: validationSuccess ? `Verification successful.` : `The signature is invalid`
      };

      res.status(200).send(result);

    } catch (err) {
      res.status(500).send(err);
    }
  });


}