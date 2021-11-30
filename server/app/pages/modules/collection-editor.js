var sparql = require("../../common/queries/sparql");

const DatabusCache = require('../../common/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');


module.exports = function (router, protector) {

  

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