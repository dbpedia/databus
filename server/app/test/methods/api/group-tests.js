const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const UriUtils = require('../../../common/utils/uri-utils');

var groupTests = {};

groupTests.groupTests = async function() {

    // ========= Get Group ===========
    await groupTests.getTestGroup(404);

    // ========= Create Group ===========

    const options = {};
    options.resolveWithFullResponse = true;
    options.method = "PUT";
    options.headers = { "x-api-key": params.APIKEY };
    options.json = true;
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME
    ]);
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/group.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
        GROUP: params.GROUP_NAME
    });

    response = await rp(options);
    assert(response.statusCode == 200, 'Group could not be created.');
    
    // ========= Get Group ===========
    await groupTests.getTestGroup(200);

    // ========= Delete Group ===========
    delete options.headers;
    options.method = "DELETE";
    options.headers = { "x-api-key": params.APIKEY };

    response = await rp(options);
    assert(response.statusCode == 204, 'Could not delete group.');

    // ========= Get Group ===========
    await groupTests.getTestGroup(404);

    // ========= invalid create Group =======
    options.method = "PUT";
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        "wrongGroup"
    ]);
    try{
        response = await rp(options);
    } catch(err){

        assert(err.response.statusCode == 400, 'Group should not be possible to create.');
    }
}

groupTests.getTestGroup = async function(expectedCode) {
    const options = {};
    options.resolveWithFullResponse = true;
    options.method = "GET";
    options.headers = { 'Accept': 'application/ld+json' }
    options.uri = UriUtils.createResourceUri([
        params.ACCOUNT_NAME,
        params.GROUP_NAME
    ]);

    var group = null;
    var statusCode = 0;

    try { 
        response = await rp(options); 
        statusCode = response.statusCode;
        group = response.body 
    } catch (err) { 
        statusCode = err.response.statusCode;
    }

    assert(statusCode == expectedCode, `Unexpected statusCode ${statusCode} when retrieving test group (${expectedCode} expected).`);
    return group;
}

module.exports = groupTests;