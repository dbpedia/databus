var sparql = require("../../common/queries/sparql");

const DatabusCache = require('../../common/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');


module.exports = function (router, protector) {

  // Calculate the hash of a collection to check for changes
  router.get('system/collections/collection-hash', async function (req, res, next) {
    try {
      var shasum = sparql.collections.getCollectionShasum(req.query.uri);
      res.status(200).send(shasum);
    } catch (err) {
      console.log(err);
      res.status(404).send('404 - collection not found');
    }
  });

  router.get('/system/collections/collection-statistics', async function(req, res, next) {
    try{
      let collectionStatistics = await sparql.collections.getCollectionStatistics(req.query.uri);

      if(collectionStatistics.length !== 0) {
        res.status(200).send(collectionStatistics);
      } else {
        res.status(404).send('Unable to find the collection.');
      }
    } catch (err) {
      res.status(404).send('Unable to find the collection.');
    }
  });

  router.get('/system/collection-editor', protector.checkSso(), async function (req, res, next) {

    var data = {};
    data.auth = ServerUtils.getAuthInfoFromRequest(req);

    if (data.auth.authenticated) {
      data.collections = await sparql.collections.getCollectionsByAccount(data.auth.info.username);
    }

    res.render('collections-editor', {
      title: 'Collection Editor',
      data: data
    });

  });

  /*
  
     router.patch('/system/collection-editor', protector.protect(), function (req, res, next) {
        var username = req.kauth.grant.id_token.content.preferred_username;
        var collection = req.body;
  
        sparql.collections.updateCollection(username, collection).then(function (response) {
  
           var updatedCollection = response.payload.collection;
           dataLoader.clearCollectionsCache(username);
           dataLoader.clearCollectionsCache(updatedCollection.uri);
           dataLoader.updateCollectionsCache(updatedCollection.uri, updatedCollection);
  
           res.status(200).send(response);
        }).catch(function (err) {
           console.log(err);
           res.status(400).send(err);
        });
     });*/

}