const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const groupTests = require('./group-tests');
const UriUtils = require('../../../common/utils/uri-utils');

var artifactTests = {};

artifactTests.artifactTests = async function() {

    // ========= Get Artifact ===========    
    await artifactTests.getTestArtifact(404);


    // ========= Create Artifact ===========

    const options = {};
    
    options.method = "PUT";
    options.json = true;
    options.resolveWithFullResponse = true;
    options.headers = { "x-api-key": params.APIKEY };
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME
    ]);
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/artifact.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
        GROUP: params.GROUP_NAME,
        ARTIFACT: params.ARTIFACT_NAME
    });

    response = await rp(options);
    assert(response.statusCode == 200, 'Artifact could not be created.');

    // ========= Get Artifact ===========
    await artifactTests.getTestArtifact(200);

    // ========= Get Group ===========
    await groupTests.getTestGroup(200);

    // ========= Delete Group =========
    options.method = "DELETE";
    options.headers = { "x-api-key": params.APIKEY }; 
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME
    ]);

    var statusCode = 0;
    try { await rp(options); } catch(err) { statusCode = err.statusCode; }
    assert(statusCode == 409, 'Deleting non-empty group should cause a conflict.');

    // ========= Delete Artifact ===========
    delete options.body;
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME
    ]);
    options.method = "DELETE";

    response = await rp(options);
    assert(response.statusCode == 204, 'Could not delete artifact.');

    // ========= Get Artifact =========
    await artifactTests.getTestArtifact(404);
}

artifactTests.getTestArtifact = async function (expectedCode) {
    const options = {};
    options.resolveWithFullResponse = true;
    options.method = "GET";
    options.headers = { 'Accept': 'application/ld+json' }
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME
    ]);

    var artifact = null;
    var statusCode = 0;

    try {
        response = await rp(options);
        statusCode = response.statusCode;
        artifact = response.body
    } catch (err) {
        statusCode = err.response.statusCode;
    }

    assert(statusCode == expectedCode, `Unexpected statusCode ${statusCode} when retrieving test artifact (${expectedCode} expected).`);
    return artifact;
}

module.exports = artifactTests;