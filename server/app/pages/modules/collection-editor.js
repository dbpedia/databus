var sparql = require("../../common/queries/sparql");

const DatabusCache = require('../../common/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');


module.exports = function (router, protector) {

  router.get('/app/collection-editor', protector.checkSso(), async function (req, res, next) {

    var data = {};
    data.auth = ServerUtils.getAuthInfoFromRequest(req);

    if (data.auth.authenticated) {
      data.collections = await sparql.collections.getCollectionsByAccount(data.auth.info.accountName);
    }

    res.render('collections-editor', {
      title: 'Collection Editor',
      data: data
    });
  });
}