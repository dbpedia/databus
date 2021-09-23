var express = require('express');
var sparql = require('../common/queries/sparql');
var databusCache = require('../common/databus-cache');
var constants = require('../common/constants.js');
var databaseManager = require('../common/remote-database-manager');
var sparql = require('../common/queries/sparql');
var shaclTester = require('../common/shacl/shacl-tester');
var jsonld = require('jsonld');

const DatabusUtils = require('../../../public/js/utils/databus-utils');
const ServerUtils = require('../common/utils/server-utils');
const Constants = require('../common/constants.js');
var constructor = require('../common/execute-construct.js');
var constructCollection = require('../common/queries/constructs/construct-collection.sparql');
const JsonldUtils = require('../common/utils/jsonld-utils');

module.exports = function (router, protector) {

  var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL || Constants.DEFAULT_DATABUS_RESOURCE_BASE_URL;

  async function putOrPatchCollection(req, res, next) {

    try {

      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot edit collections in a foreign namespace.\n');
        return;
      }

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateCollectionRDF(req.body);
      
       // Return failure
       if (!shaclResult.isSuccess) {
        // todo
        var response = 'SHACL validation error:\n';
        for (var m in shaclResult.messages) {
          response += `>>> ${shaclResult.messages[m]}\n`
        }

        res.status(400).send(response);
        return;
      }

      // Construct
      var triples = await constructor.executeConstruct(req.body, constructCollection);
      var expandedGraphs = await jsonld.expand(await jsonld.fromRDF(triples));

      var collectionGraph = JsonldUtils.getTypedGraph(expandedGraphs, 
        'https://databus.dbpedia.org/system/ontology#Collection');
      
      // Possible TODO: validate instead of replace
      collectionGraph['@id'] = `${baseUrl}${req.originalUrl}`;
      collectionGraph['http://purl.org/dc/terms/publisher'] = [ 
        {
          "@id": `${baseUrl}/${req.params.account}#this`
        }
      ];


      var targetPath = req.originalUrl.substring(1) + '/data.jsonld';
      console.log(`SAVING TO ${targetPath}`);
      var publishResult = await databaseManager.save(req.params.account, targetPath, expandedGraphs);

      // Return failure
      if (!publishResult.isSuccess) {
        res.status(500).send(publishResult);
      }

      // Return success
      res.status(200).send({
        message: 'Collection saved successfully.\n',
        data: expandedGraphs
      });

    } catch (err) {
      console.log(err);
      res.status(403).send(err);
    }
  }

  router.put('/:account/collections/:collection', protector.protect(), putOrPatchCollection);
  router.patch('/:account/collections/:collection', protector.protect(), putOrPatchCollection);

  router.delete('/:account/collections/:collection', protector.protect(), async function (req, res, next) {
    try {

      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot edit collections in a foreign namespace.\n');
        return;
      }

      var targetPath = req.originalUrl.substring(1) + '/data.jsonld';
      var deleteResult = await databaseManager.delete(req.databus.accountName, targetPath);

      // Return failure
      if (!deleteResult.isSuccess) {
        res.status(500).send(deleteResult);
      }

      // Return success
      res.status(200).send('Collection deleted successfully.\n');

    } catch (err) {
      console.log(err);
      res.status(403).send(err);
    }
  });

  router.get('/:account/collections/:collection', ServerUtils.SPARQL_ACCEPTED, function (req, res, next) {
    sparql.collections.getCollectionQuery(req.params.account, req.params.collection).then(function (result) {
      if (result != null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Unable to find the collection.');
      }
    });
  });
}
