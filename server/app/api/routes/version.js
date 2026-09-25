const Constants = require('../../common/constants.js');
const ServerUtils = require('../../common/utils/server-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');

const VersionWriter = require('../lib/version-writer.js');
const publishResource = require('../lib/publish-resource.js');

var sparql = require('../../common/queries/sparql.js');
const axios = require('axios');
var GstoreHelper = require('../../common/utils/gstore-helper.js');
const UriUtils = require('../../common/utils/uri-utils.js');
const getLinkedData = require('../../common/get-linked-data.js');
var cors = require('cors');
const DatabusMessage = require('../../common/databus-message.js');


module.exports = function (router, protector) {


  /**
   * Publishing via PUT request
   */
  router.put('/:account/:group/:artifact/:version', protector.protectAccount(true), async function (req, res, next) {
    try {

      var versionUri = UriUtils.createResourceUri([
        req.params.account,
        req.params.group,
        req.params.artifact,
        req.params.version
      ]);

      var fetchFileProperties = null;
      if (req.query['fetch-file-properties'] == 'false') {
        fetchFileProperties = false;
      }
      if (req.query['fetch-file-properties'] == 'true') {
        fetchFileProperties = true;
      }

      await publishResource(req, res, VersionWriter, versionUri, { fetchFileProperties });

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact/:version', ServerUtils.NOT_HTML_ACCEPTED, cors(), async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group,
      req.params.artifact,
      req.params.version
    ]);

    var template = require('../../common/queries/constructs/ld/construct-version.sparql');
    getLinkedData(req, res, next, resourceUri, template);
  });

  router.get('/:account/:group/:artifact/:version/:file', async function (req, res, next) {
    
    // Return dataids?
    if (req.params.file == Constants.DATABUS_FILE_DATAID) {

      const repo = req.params.account;
      const path = `${req.params.group}/${req.params.artifact}/${req.params.version}/${req.params.file}`;
      const url = `${process.env.DATABUS_DATABASE_URL}/graph/read?repo=${repo}&path=${path}`;

      try {
        console.log(`Piping to ${url}`);

        // Use axios to fetch data
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/ld+json'
          }
        });

        // Pipe the response data to the client
        res.setHeader('Content-Type', 'application/ld+json');
        res.send(response.data);
        return;

      } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching data from Databus database.');
        return;
      }
    }

    try {
      var result = await sparql.dataid.getDownloadUrl(req.params.account, req.params.group,
        req.params.artifact, req.params.version, req.params.file);

      if (result == null) {
        res.status(404).send('Sorry can\'t find that!');
        return;
      }

      // Send message to master to register metrics
      if (process.send != undefined) {
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

        process.send({
          id: DatabusMessage.FILE_DOWNLOADED,
          body: {
            url : fullUrl,
            target : result.downloadUrl
          } 
        });
      }

      res.redirect(307, result.downloadUrl);
    } catch (err) {
      console.log(err);
      res.status(404).send('Sorry can\'t find that! ');
    };
  });

  router.delete('/:account/:group/:artifact/:version', protector.protectAccount(true), async function (req, res, next) {

    var versionUri = UriUtils.fromRequest(req);

    // Check if the artifact exists
    var exists = await sparql.dataid.hasVersion(
      req.params.account,
      req.params.group,
      req.params.artifact,
      req.params.version);

    if (!exists) {
      res.status(204).send(`The verison <${versionUri}> does not exist.`);
      return;
    }

    // Delete from gstore and return result
    var gstorePath = `${req.params.group}/${req.params.artifact}/${req.params.version}/${Constants.DATABUS_FILE_DATAID}`;
    var result = await GstoreHelper.delete(req.params.account, gstorePath);

    if (!result.isSuccess) {
      res.status(result.error.status).send(`Failed to delete version <${versionUri}>: ${result.error.message}`);
      return;
    }

    res.status(204).send(`The version <${versionUri}> has been deleted.`);
  });
}