const JsonldUtils = require('../../common/utils/jsonld-utils');
const ServerUtils = require('../../common/utils/server-utils');
const Constants = require('../../common/constants.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris');


var request = require('request');
var sparql = require('../../common/queries/sparql');
var GstoreHelper = require('../../common/gstore-helper');
var sparql = require('../../common/queries/sparql');
var shaclTester = require('../../common/shacl/shacl-tester');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructCollection = require('../../common/queries/constructs/construct-collection.sparql');

module.exports = function (router, protector) {

  var baseUrl = process.env.DATABUS_RESOURCE_BASE_URL || Constants.DEFAULT_DATABUS_RESOURCE_BASE_URL;

  // Calculate the hash of a collection to check for changes
  router.get('/api/collection/md5hash', async function (req, res, next) {
    try {
      var shasum = await sparql.collections.getCollectionShasum(req.query.uri);
      res.status(200).send(shasum);
    } catch (err) {
      console.log(err);
      res.status(404).send('404 - collection not found');
    }
  });

  /**
  router.get('/api/collection/statistics', async function(req, res, next) {
    try{
      let collectionStatistics = await sparql.collections.getCollectionStatistics(req.query.uri);

      if(collectionStatistics.length !== 0) {
        res.status(200).send(collectionStatistics);
      } else {
        res.status(404).send('Unable to find statistics for this collection.');
      }
    } catch (err) {
      console.log(err);
      res.status(404).send('Unable to find statistics for this collection.');
    }
  }); */

  router.put('/:account/collections/:collection', protector.protect(true), async function(req, res, next) {

    try {
      if (req.params.account != req.databus.accountName) {
        res.status(403).send({
          success : false,
          message: 'You cannot edit collections in a foreign namespace.'
        });
        return;
      }

      console.log(req.body);

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateCollectionRDF(req.body);
      
       // Return failure
       if (!shaclResult.isSuccess) {
        // todo
        var response = 'SHACL validation error:\n';
        for (var m in shaclResult.messages) {
          response += `> * ${shaclResult.messages[m]}\n`
        }

        res.status(400).send({
          success : false,
          message: response
        });
        return;
      }

      // Construct
      var triples = await constructor.executeConstruct(req.body, constructCollection);
      var expandedGraphs = await jsonld.expand(await jsonld.fromRDF(triples));


      var collectionGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATAID_COLLECTION);
    
    

      // Possible TODO: validate instead of replace
      collectionGraph['@id'] = `${baseUrl}${req.originalUrl}`;
      collectionGraph['http://purl.org/dc/terms/publisher'] = [ 
        {
          "@id": `${baseUrl}/${req.params.account}#this`
        }
      ];

      var targetPath = `collections/${req.params.collection}/collection.jsonld`;
      var publishResult = await GstoreHelper.save(req.params.account, targetPath, expandedGraphs);

      // Return failure
      if (!publishResult.isSuccess) {
        res.status(500).send({
          success : false,
          message: `Internal database error.`
        });
      }

      // Return success
      res.status(200).send({
        success: true,
        message: 'Collection saved successfully.',
        data: expandedGraphs
      });

    } catch (err) {
      console.log(err);
      res.status(403).send({
        success: true,
        message: err,
      });
    }
  });

  router.delete('/:account/collections/:collection', protector.protect(), async function (req, res, next) {
    try {

      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot edit collections in a foreign namespace.\n');
        return;
      }

      var targetPath = `collections/${req.params.collection}/collection.jsonld`;

      var resource = await GstoreHelper.read(req.params.account, targetPath);
  
      if (resource == null) {
        res.status(404).send(`The collection "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" does not exist.`);
        return;
      }


      var deleteResult = await GstoreHelper.delete(req.params.account, targetPath);

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

  router.get('/:account/collections/:collection', ServerUtils.SPARQL_ACCEPTED, async function (req, res, next) {

    sparql.collections.getCollectionQuery(req.params.account, req.params.collection).then(function (result) {
      if (result != null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Unable to find the collection.');
      }
    });
  });

  router.get('/:account/collections/:collection', ServerUtils.NOT_HTML_ACCEPTED, function (req, res, next) {

    var repo = req.params.account;
    var path = `collections/${req.params.collection}/collection.jsonld`;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);

    /*
    sparql.collections.getCollection(req.params.publisher, req.params.collection).then(function (result) {
      if (result != null) {
        res.status(200).send(result);
      } else {
        res.status(404).send('Unable to find the collection.');
      }
    });*/
  });
}
