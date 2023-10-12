const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const ServerUtils = require('../../common/utils/server-utils');
const Constants = require('../../common/constants.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
var sparql = require('../../common/queries/sparql');
var GstoreHelper = require('../../common/utils/gstore-helper');
var sparql = require('../../common/queries/sparql');
var shaclTester = require('../../common/shacl-tester');
var jsonld = require('jsonld');
var constructor = require('../../common/execute-construct.js');
var constructCollection = require('../../common/queries/constructs/construct-collection.sparql');
const UriUtils = require('../../common/utils/uri-utils');
const getLinkedData = require('../../common/get-linked-data');

var defaultContext = require('./../../common/res/context.jsonld');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');
const DatabusUtils = require('../../../../public/js/utils/databus-utils');
const DatabusMessage = require('../../common/databus-message');

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

  router.put('/:account/collections/:collection', protector.protect(true), async function (req, res, next) {

    try {

      var accountName = req.params.account;

      if (accountName != req.databus.accountName) {

        res.status(403).send({
          success: false,
          message: 'You cannot edit collections in a foreign namespace.'
        });
        return;
      }


      // Construct
      var triples = await constructor.executeConstruct(req.body, constructCollection);
      var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

      var collectionGraph = JsonldUtils.getTypedGraph(expandedGraphs, DatabusUris.DATABUS_COLLECTION);

      if (collectionGraph == null) {
        res.status(400).send({
          success: false,
          message: 'No databus:Collection found in the input.'
        });
        return;
      }

      var collectionUri = `${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}`;

      collectionGraph[DatabusUris.JSONLD_ID] = collectionUri;

      var publisherUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}${DatabusConstants.WEBID_THIS}`;
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;

      // Set publisher
      collectionGraph[DatabusUris.DCT_PUBLISHER] = [{}];
      collectionGraph[DatabusUris.DCT_PUBLISHER][0][DatabusUris.JSONLD_ID] = publisherUri;
     
      // Set account
      collectionGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY] = [{}];
      collectionGraph[DatabusUris.DATABUS_ACCOUNT_PROPERTY][0][DatabusUris.JSONLD_ID] = accountUri;

      var timeString = DatabusUtils.timeStringNow();

      // Set times
      if (collectionGraph[DatabusUris.DCT_CREATED] == undefined) {
        collectionGraph[DatabusUris.DCT_CREATED] = [{}];
        collectionGraph[DatabusUris.DCT_CREATED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
        collectionGraph[DatabusUris.DCT_CREATED][0][DatabusUris.JSONLD_VALUE] = timeString;
      }

      if (collectionGraph[DatabusUris.DCT_MODIFIED] == undefined) {
        collectionGraph[DatabusUris.DCT_MODIFIED] = [{}];
        collectionGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DATE_TIME;
        collectionGraph[DatabusUris.DCT_MODIFIED][0][DatabusUris.JSONLD_VALUE] = timeString;
      }

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateCollectionRDF(expandedGraphs);

      // Return failure
      if (!shaclResult.isSuccess) {

        res.status(400).send({
          success: false,
          message: shaclResult
        });
        return;
      }

      // Compact graph, determine target path
      var compactedGraph = await jsonld.compact(expandedGraphs, defaultContext);

      if (process.env.DATABUS_CONTEXT_URL != null) {
        compactedGraph[DatabusUris.JSONLD_CONTEXT] = process.env.DATABUS_CONTEXT_URL;
      }

      var targetPath = UriUtils.createPath([
        Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER,
        req.params.collection,
        Constants.DATABUS_FILE_COLLECTION
      ]);

      console.log(`Saving collection <${collectionUri}> to ${req.params.account}:${targetPath}`);
      var publishResult = await GstoreHelper.save(req.params.account, targetPath, compactedGraph);

      if(process.send != undefined) {
        process.send({
          id: DatabusMessage.REQUEST_SEARCH_INDEX_REBUILD,
          resource: collectionUri
        });
      }

      // Return failure
      if (!publishResult.isSuccess) {
        res.status(500).send({
          success: false,
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
        success: false,
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
        next('route');
      }
    }, function (err) {
      console.log(err);
      res.status(500).send();
    });
  });

  router.get('/:account/collections/:collection', ServerUtils.NOT_HTML_ACCEPTED, function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = UriUtils.createResourceUri([
      req.params.account,
      "collections",
      req.params.collection
    ]);

    var template = require('../../common/queries/constructs/ld/construct-collection.sparql');
    getLinkedData(req, res, next, resourceUri, template);

  });
}
