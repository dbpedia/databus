const Constants = require('../common/constants.js');
const ServerUtils = require('../common/utils/server-utils.js');
var cors = require('cors');

var request = require('request');var database = require('../common/remote-database-manager');


module.exports = function (router, protector) {

  require('./modules/collections')(router, protector);
  require('./modules/accounts')(router, protector);


  router.get('/', cors(), ServerUtils.NOT_HTML_ACCEPTED, async function(req, res, next) {
    var manifest = require('../../manifest.ttl');
    res.status(200).send(`${manifest}\n`);
  });

  router.get('/:account/:group', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = req.params.group;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}/group.jsonld`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.NOT_HTML_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${Constants.DATABUS_FILE_DATAID}`;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
  });

  router.get('/:account/:group/:artifact/:version/:file', async function (req, res, next) {

    // Return dataids?
    if (req.params.file == Constants.DATABUS_FILE_DATAID) {

      var repo = req.params.account;
      var path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${req.params.file}`;

      let options = {
        url: `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`,
        headers: {
          'Accept': 'application/ld+json'
        },
        json: true
      };

      console.log(`Piping to ${options.url}`);
      request(options).pipe(res);
      return;
    }

    try {
      var result = await sparql.dataid.getDownloadUrl(req.params.account, req.params.group,
        req.params.artifact, req.params.version, req.params.file);

      if (result == null) {
        res.status(404).send('Sorry can\'t find that!');
        return;
      }

      res.redirect(307, result.downloadUrl);
    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry can\'t find that! ');
    };
  });


  router.delete('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {

    // Requesting a DELETE on an uri outside of one's namespace is rejected
    if (req.params.account != req.databus.accountName) {
      res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
      return;
    }
    var path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${Constants.DATABUS_FILE_DATAID}`;
    var resource = await database.read(req.params.account, path);

    if (resource == null) {
      res.status(404).send(Constants.MESSGAGE_NOT_FOUND);
      return;
    }

    var result = await database.delete(req.params.account, path);

    res.status(result.isSuccess ? 200 : 500).send();

  });

  router.delete('/:account/:group', protector.protect(), async function (req, res, next) {

    // Requesting a DELETE on an uri outside of one's namespace is rejected
    if (req.params.account != req.databus.accountName) {
      res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
      return;
    }

    var path = `${req.params.group}/${Constants.DATABUS_FILE_GROUP}`;
    var resource = await database.read(req.params.account, path);

    if (resource == null) {
      res.status(404).send(Constants.MESSGAGE_NOT_FOUND);
      return;
    }

    var result = await database.delete(req.params.account, path);
    res.status(result.isSuccess ? 200 : 500).send();
  });




}