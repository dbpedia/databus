const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');

module.exports = async function groupTests(user) {

    const options = {};
    options.method = "POST";
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}/${params.GROUP_NAME}`;

    // ========= Get Group ===========
    options.method = "GET";
    options.headers = { 'Accept': 'application/ld+json' }

    var error = null;
    try { response = await rp(options); } catch (err) { error = err; }
    assert(error != null && error.response.statusCode == 404, 'Group does not exist yet but did not receive 404.');

    // ========= Create Group ===========
    options.method = "PUT";
    options.headers = { "x-api-key": params.APIKEY };
    options.json = true;
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/group.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
        GROUP: params.GROUP_NAME
    });

    response = await rp(options);
    assert(response.statusCode == 200, 'Group could not be created.');

    // ========= Get Group ===========
    delete options.headers;
    delete options.body;

    options.method = "GET";
    options.headers = { 'Accept': 'application/ld+json' }

    response = await rp(options);
    assert(response.statusCode == 200, 'Could not get group.');

    // ========= Delete Group ===========
    delete options.headers;
    options.method = "DELETE";
    options.headers = { "x-api-key": params.APIKEY };

    response = await rp(options);
    assert(response.statusCode == 200, 'Could not delete group.');

    // ========= Get Group ===========
    delete options.headers;
    delete options.body;
    options.headers = { 'Accept': 'application/ld+json' }
    options.method = "GET";

    var error = null;
    try { response = await rp(options); } catch (err) { error = err; }
    assert(error != null && error.response.statusCode == 404, 'Group does not exist but did not receive 404.');
}
