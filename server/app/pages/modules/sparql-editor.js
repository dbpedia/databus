var sparql = require("../../common/queries/sparql");

const DatabusCache = require('../../common/cache/databus-cache');
const ServerUtils = require('../../common/utils/server-utils.js');


module.exports = function (router, protector) {

  router.get('/sparql', protector.checkSso(), async function (req, res, next) {

    var data = {};
    data.auth = ServerUtils.getAuthInfoFromRequest(req);

    res.render('sparql-editor', {
      title: 'Sparql Editor',
      data: data
    });
  });
}