var defaultContext = require('../../../context.json');

const publishGroup = require('./publish-group');
const publishDataId = require('./publish-dataid');
const Constants = require('../common/constants');

const RDF_URIS = {
  DATASET: 'http://dataid.dbpedia.org/ns/core#Dataset',
  DB_TRACTATE_V1: 'https://databus.dbpedia.org/system/ontology#DatabusTractateV1',
  PROP_PUBLISHER: 'http://purl.org/dc/terms/publisher',
  PROOF: 'https://w3id.org/security#proof',
  TYPE: '@type',
  VERSION: 'http://dataid.dbpedia.org/ns/core#Version',
  ARTIFACT: 'http://dataid.dbpedia.org/ns/core#Artifact',
  GROUP: 'http://dataid.dbpedia.org/ns/core#Group',
  PROP_VERSION: 'http://dataid.dbpedia.org/ns/core#version',
  PROP_ARTIFACT: 'http://dataid.dbpedia.org/ns/core#artifact',
  PROP_GROUP: 'http://dataid.dbpedia.org/ns/core#group'
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = function (router, protector) {


  router.post('/system/publish', protector.protect(), async function (req, res, next) {


    try {

      res.status(202);

      // Get the account namespace
      var account = req.databus.accountName;

      // Find graph
      var graph = req.body;

      // Replace context if graph uses default context
      if (graph['@context'] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var groupResult = await publishGroup(account, graph, function (message) {
        res.write(message);
      });

      if (groupResult != undefined) {
        if (groupResult.code > 201) {
          res.end(groupResult.message);
          return;
        }

        res.write(groupResult.message);
      }

      var dataIdResult = await publishDataId(account, graph, function (message) {
        res.write(message);
      });

      if (dataIdResult.code > 201) {
        res.end(dataIdResult.message);
        return;
      }

      res.end();

    } catch (err) {
      console.log(err);
      res.status(500).end(err);
    }
  });

  router.put('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {

    try {

      console.log('Upload request received at ' + req.originalUrl);
      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot publish data in a foreign namespace.\n');
        return;
      }

      var account = req.databus.accountName;
      var graph = req.body;

      // Replace if default context
      if (graph['@context'] == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var dataIdResult = await publishDataId(account, graph, function (message) {
        console.log(message);
      });


      res.status(dataIdResult.code).send(dataIdResult.message);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });


  /**
   * Publishing of groups
   */
  router.put('/:account/:group', protector.protect(), async function (req, res, next) {

    try {

      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot edit groups in a foreign namespace.\n');
        return;
      }

      var account = req.databus.accountName;

      // Find context:
      var graph = req.body;
      var context = graph['@context'];

      if (context == Constants.DATABUS_DEFAULT_CONTEXT_URL) {
        graph['@context'] = defaultContext;
      }

      var groupResult = await publishGroup(account, graph);
      res.status(groupResult.code).send(groupResult.message);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.delete('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {


  });

  router.delete('/:account/:group', protector.protect(), async function (req, res, next) {


  });

}