const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const UriUtils = require('../../../common/utils/uri-utils');
const artifactTests = require('./artifact-tests');
const groupTests = require('./group-tests');

var versionTests = {};

versionTests.versionTests = async function () {

    // ========= Get Version ===========    
    await versionTests.getTestVersion(404);

    // ========= Create Version ===========
    const options = {};

    options.method = "PUT";
    options.json = true;
    options.resolveWithFullResponse = true;
    options.headers = { "x-api-key": params.APIKEY };
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME,
        params.VERSION_NAME
    ]);
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/version.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
        GROUP: params.GROUP_NAME,
        ARTIFACT: params.ARTIFACT_NAME,
        VERSION: params.VERSION_NAME
    });

    response = await rp(options);
    assert(response.statusCode == 200, 'Version could not be created.');

    // ========= Get Version ===========    
    await versionTests.getTestVersion(200);

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
    try { await rp(options); } catch (err) { statusCode = err.statusCode; }
    assert(statusCode == 409, 'Deleting non-empty group should cause a conflict.');

    // ========= Delete Artifact ===========
    options.method = "DELETE";
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME
    ]);

    try { await rp(options); } catch (err) { statusCode = err.statusCode; }
    assert(statusCode == 409, 'Deleting non-empty artifact should cause a conflict.');

    // ========= Delete Version ===========
    options.method = "DELETE";
    options.headers = { "x-api-key": params.APIKEY };
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME,
        params.VERSION_NAME
    ]);

    response = await rp(options);
    assert(response.statusCode == 204, 'Could not delete version.');

    // ========= Get Version ===========    
    await versionTests.getTestVersion(404);
}


versionTests.getTestVersion = async function (expectedCode) {
    const options = {};
    options.resolveWithFullResponse = true;
    options.method = "GET";
    options.headers = { 'Accept': 'application/ld+json' }
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME,
        params.ARTIFACT_NAME,
        params.VERSION_NAME
    ]);

    var version = null;
    var statusCode = 0;

    try {
        response = await rp(options);
        statusCode = response.statusCode;
        version = response.body
    } catch (err) {
        statusCode = err.response.statusCode;
    }

    assert(statusCode == expectedCode, `Unexpected statusCode ${statusCode} when retrieving test artifact (${expectedCode} expected).`);
    return version;
}

module.exports = versionTests;