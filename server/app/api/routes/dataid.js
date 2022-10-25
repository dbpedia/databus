const Constants = require('../../common/constants.js');
const ServerUtils = require('../../common/utils/server-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');

const publishDataId = require('../lib/publish-dataid');

var sparql = require('../../common/queries/sparql');
var request = require('request');
var GstoreHelper = require('../../common/utils/gstore-helper');
var defaultContext = require('../../../../model/generated/context.json');

const MESSAGE_DATAID_PUBLISH_FINISHED = 'Publishing DataId finished with code ';

module.exports = function (router, protector) {


  /**
   * Publishing via PUT request
   */
   router.put('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {
    try {

      console.log('Upload request received at ' + req.originalUrl);

      // Requesting a PUT on an uri outside of one's namespace is rejected
      if (req.params.account != req.databus.accountName) {
        res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
        return;
      }

      var graph = req.body;

       // Resolve the context if it is the default context
       if (graph[DatabusUris.JSONLD_CONTEXT] == process.env.DATABUS_DEFAULT_CONTEXT_URL) {
        graph[DatabusUris.JSONLD_CONTEXT] = defaultContext;
      }

      // Call the publishing routine and log to a string
      var report = `Publishing DataId.\n`;

      var dataIdResult = await publishDataId(req.databus.accountName, graph, false, function (message) {
        console.log(message);
        report += `> ${message}\n`;
      }, false);

      

      var returnCode = dataIdResult.code;

      if (returnCode < 200) {
        returnCode = 400;
      }

      if (dataIdResult != undefined) {
        report += `${MESSAGE_DATAID_PUBLISH_FINISHED}${returnCode}.\n`;
      }

      // Return the result with the logging string
      res.status(returnCode).send(report);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
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

    // Requesting a DELETE on a uri outside of one's namespace is rejected
    if (req.params.account != req.databus.accountName) {
      res.status(403).send(Constants.MESSAGE_WRONG_NAMESPACE);
      return;
    }
    var path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${Constants.DATABUS_FILE_DATAID}`;
    var resource = await GstoreHelper.read(req.params.account, path);

    if (resource == null) {
      res.status(204).send(`The DataId of version "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" does not exist.`);
      return;
    }

    var result = await GstoreHelper.delete(req.params.account, path);
    var message = '';

    if(result.isSuccess) {
      message = `The DataId of version "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}" has been deleted.`
    } else {
      message = `Internal database error. Failed to delete the DataId of version "${process.env.DATABUS_RESOURCE_BASE_URL}${req.originalUrl}".`
    }


    res.status(result.isSuccess ? 200 : 500).send(message);

  });





}