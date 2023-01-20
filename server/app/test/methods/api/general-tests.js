const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const jsonld = require('jsonld');

module.exports = async function generalTests() {

    await manifestTest();
    await publishTest();
}

async function manifestTest() {

    // ========= GET Manifest ==========
    const options = {};
    options.headers = { "x-api-key": params.APIKEY };

    options.method = "GET";
    options.uri = process.env.DATABUS_RESOURCE_BASE_URL;
    options.headers['Accept'] = "text/turtle"

    var response = await rp(options);
    var manifest = require('./../../../../manifest.ttl');

    assert(response == manifest, "Manifest cannot be retrieved.");
}

async function publishTest() {

    // ======== Publish Dataid =======
    const options = {};
    options.method = "POST";
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;
    options.json = true;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/publish`;
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/version.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
        GROUP: params.GROUP_NAME,
        ARTIFACT: params.ARTIFACT_NAME,
        VERSION: params.VERSION_NAME
    });

    response = await rp(options);
    assert(response.statusCode == 200, 'Metadata could not be published.');


    // ========= Delete Version ===========
    delete options.headers;
    options.method = "DELETE";
    options.headers = { "x-api-key": params.APIKEY };
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}/${params.GROUP_NAME}/${params.ARTIFACT_NAME}/${params.VERSION_NAME}`;

    response = await rp(options);
    assert(response.statusCode == 204, 'Could not delete version.');

}
