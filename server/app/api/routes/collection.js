const JsonldUtils = require('../../../../public/js/utils/jsonld-utils');
const ServerUtils = require('../../common/utils/server-utils');
const Constants = require('../../common/constants.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
var sparql = require('../../common/queries/sparql');
var GstoreHelper = require('../../common/utils/gstore-helper');
var exec = require('../../common/execute-query');
const UriUtils = require('../../common/utils/uri-utils');
const getLinkedData = require('../../common/get-linked-data');
const CollectionWriter = require('../lib/collection-writer');
const publishResource = require('../lib/publish-resource');
var cors = require('cors');
const QueryBuilder = require('../../../../public/js/query-builder/query-builder.js');
const QueryTemplates = require('../../../../public/js/query-builder/query-templates.js');

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
      var collectionUri = UriUtils.createResourceUri([
        req.params.account,
        Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER,
        req.params.collection
      ]);

      await publishResource(req, res, CollectionWriter, collectionUri);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.delete('/:account/collections/:collection', protector.protect(), async function (req, res, next) {
    try {

      var collectionUri = UriUtils.createResourceUri([
        req.params.account,
        Constants.DATABUS_COLLECTIONS_GROUP_IDENTIFIER,
        req.params.collection
      ]);

      if (!(await ServerUtils.hasWriteAccess(req, req.params.account, collectionUri))) {
        res.status(403).send('You cannot edit collections in a foreign namespace.\n');
        return;
      }

      var targetPath = `collections/${req.params.collection}/metadata.jsonld`;
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
      res.status(204).send('Collection deleted successfully.\n');

    } catch (err) {
      console.log(err);
      res.status(403).send(err);
    }
  });

  router.get('/:account/collections/:collection', ServerUtils.SPARQL_ACCEPTED, cors(), async function (req, res, next) {

    try {
      var collectionUri = UriUtils.createResourceUri([req.params.account, 'collections', req.params.collection]);

      var queryOptions = {};
      queryOptions.COLLECTION_URI = collectionUri;

      var selectQuery = require('../../common/queries/sparql/get-collection-content.sparql');
      selectQuery = exec.formatQuery(selectQuery, queryOptions);

      var entry = await exec.executeSelect(selectQuery);

      if (entry.length == 0) {
        res.status(404).send();
        return;
      }

      var root = JSON.parse(unescape(entry[0].content)).root;

      var sparqlQuery = QueryBuilder.build({
        node: root,
        template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
        resourceBaseUrl: process.env.DATABUS_RESOURCE_BASE_URL
      });

      res.status(200).send(sparqlQuery);
    } catch (err) {
      console.log(err);
      res.status(500).send();
    }
  });

  router.get('/:account/collections/:collection', ServerUtils.NOT_HTML_ACCEPTED, cors(), function (req, res, next) {

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
