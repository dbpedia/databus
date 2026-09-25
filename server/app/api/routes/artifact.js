const ServerUtils = require("../../common/utils/server-utils");
const Constants = require("../../common/constants");
const GstoreHelper = require('../../common/utils/gstore-helper');
const JsonldUtils = require("../../../../public/js/utils/jsonld-utils");
const DatabusLogger = require("../../common/databus-logger");
const UriUtils = require("../../common/utils/uri-utils");
const getLinkedData = require("../../common/get-linked-data");
const ArtifactWriter = require("../lib/artifact-writer");
const publishResource = require("../lib/publish-resource");
const jsonld = require('jsonld');
var cors = require('cors');
const sparql = require("../../common/queries/sparql");

module.exports = function (router, protector) {

  router.put('/:account/:group/:artifact', protector.protect(true), async function (req, res, next) {

    try {
      var artifactUri = UriUtils.createResourceUri([
        req.params.account,
        req.params.group,
        req.params.artifact
      ]);

      await publishResource(req, res, ArtifactWriter, artifactUri);

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.get('/:account/:group/:artifact', ServerUtils.NOT_HTML_ACCEPTED, cors(), async function (req, res, next) {

    if (req.params.account.length < 4) {
      next('route');
      return;
    }

    var resourceUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.params.account}/${req.params.group}/${req.params.artifact}`;
    var template = require('../../common/queries/constructs/ld/construct-artifact.sparql');
    getLinkedData(req, res, next, resourceUri, template);
  });

  router.delete('/:account/:group/:artifact', protector.protect(true), async function (req, res, next) {

    var artifactUri = UriUtils.createResourceUri([
      req.params.account,
      req.params.group,
      req.params.artifact
    ]);

    // Check if the artifact exists
    var exists = await sparql.dataid.hasArtifact(artifactUri);

    if (!exists) {
      res.status(204).send(`The artifact  <${artifactUri}> does not exist.`);
      return;
    }

    // Allow deletion only if there are no artifacts (and thus no versions).
    var versions = await sparql.dataid.getVersionsByArtifact(artifactUri);

    if (versions.length > 0) {
      res.status(409).send(`Unable to delete non-empty artifact <${artifactUri}>.`);
      return;
    }

    // Delete from gstore and return result
    var gstorePath = `${req.params.group}/${req.params.artifact}/metadata.jsonld`;
    var result = await GstoreHelper.delete(req.params.account, gstorePath);

    if (!result.isSuccess) {

      gstorePath = `${req.params.group}/${req.params.artifact}/artifact.jsonld`;
      result = await GstoreHelper.delete(req.params.account, gstorePath);

      if (!result.isSuccess) {
        res.status(result.error.status).send(`Failed to delete artifact <${artifactUri}>: ${result.error.message}`);
        return;
      }

    }

    res.status(204).send(`The artifact <${artifactUri}> has been deleted.`);
  });

}