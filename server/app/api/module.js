const Constants = require('../common/constants.js');
const ServerUtils = require('../common/utils/server-utils.js');
var cors = require('cors');
var sparql = require('../common/queries/sparql');

var request = require('request');


module.exports = function (router, protector) {

  require('./swagger-page')(router, protector);
  require('./routes/general')(router, protector);
  require('./routes/tractate')(router, protector);
  require('./routes/collection')(router, protector);
  require('./routes/account')(router, protector);
  require('./routes/group')(router, protector);
  require('./routes/artifact')(router, protector);
  require('./routes/dataid')(router, protector);

  router.get('/', cors(), ServerUtils.NOT_HTML_ACCEPTED, async function(req, res, next) {
    var manifest = require('../../manifest.ttl');
    res.status(200).send(`${manifest}`);
  });
  


}