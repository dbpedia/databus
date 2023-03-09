const params = require('../../test-user.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const { createTestUser, deleteTestUser } = require('../../test-utils');

var accountTests = {};

/**
 * Tests for Databus accounts
 * @param {*} user 
 */
accountTests.accountTests = async function() {

    await createTestUser(params);

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;

    var webid = ServerUtils.formatJsonTemplate(require('../../templates/account.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT_NAME: params.ACCOUNT_NAME
    });

    // delete account from preexisting tests
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "DELETE";
    await rp(options);

    // ======= GET non-existing Account ==========

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "GET";
    options.headers['Accept'] = "application/ld+json"

    // should return 404 because account doesn't exist yet
    try {
        await rp(options);
        assert(false, 'Account does not exist, request should return 404.');
    } catch (err) {
        assert(err.response.statusCode == 404, 'Expected 404 when retrieving account.');
    }

    // ========= PUT Account - valid ===========

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "PUT";
    options.json = true;
    options.body = webid;

    var response = await rp(options);
    assert(response.statusCode == 201, 'Account could not be created.');

    // ======= PUT Account - invalid =======

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/janfo`;

    try {
        response = await rp(options);
        assert(response.statusCode != 200, 'Able to write to janfo account. This should be forbidden');
    } catch (err) {
        assert(err.response.statusCode == 403, 'Trying to write to unowned account. 403 expected.');
    }

    // ======= GET existing Account ==========

    delete options.body;
    delete options.json;

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "GET";
    options.headers['Accept'] = "application/ld+json"

    response = await rp(options);
    assert(response.statusCode == 200, 'Expected 200 when retrieving account.');

    // ========= EXECUTE OTHER TESTS ==========

    await apiKeyTests();
    await webidTests();

    // ========= DELETE Account ==========

    options.method = "DELETE";

    response = await rp(options);
    assert(response.statusCode == 200, 'Expected 200 when deleting existing account.');

    response = await rp(options);
    assert(response.statusCode == 204, 'Expected 204 when deleting deleted account.');

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/janfo`;

    try {
        await rp(options);
        assert(err.response.statusCode != 200, 'Deleting unowned account should not be possible');
    } catch (err) {
        assert(err.response.statusCode == 403, 'Expected 403 when trying to delete unowned account.');
    }

    await deleteTestUser(params);
}


/**
 * Tests for removing and adding extra API keys
 */
async function apiKeyTests() {

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;

    let keyName = "testkey2"

    // ========= Create API Key ===========

    options.method = "POST";
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/api-key/create?name=${keyName}`;

    response = await rp(options);
    assert(response.statusCode == 200, 'API key could not be created.');

    // ======== Create already existing API Key =========
    try{
        response = await rp(options);
        assert(false, 'creating already existing API key shouldnt be possible.')
    } catch(err) {
        assert(err.response.statusCode == 400, 'API key could be created. Shouldnt have been possible, because it already exists.');
    }

    // ========= Delete API Key ===========

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/api-key/delete?name=${keyName}`;

    response = await rp(options);
    assert(response.statusCode == 200, 'API key could not be deleted.');

    // ========= Delete Non-Existing API Key ===========

    response = await rp(options);
    assert(response.statusCode == 204, 'API key does not exist. Expected return code 204.');    
}

/**
 * Tests for connecting a WebId to an account
 */
async function webidTests() {

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;
    options.method = "POST";

    // ========= POST WebId ===========

    let webid = encodeURIComponent('https://holycrab13.github.io/webid.ttl')
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/webid/add?uri=${webid}`;

    try {
        response = await rp(options);
        assert(response.statusCode != 200, 'Unable to add webid to account');
    } catch (err) {
        assert(err.response.statusCode == 403, '403 expected since there is no backlink.');
    }

    // ========= Remove WebId ===========

    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/webid/remove?uri=${webid}`;

    response = await rp(options);
    assert(response.statusCode == 200, 'WebId could not be removed.');
}

accountTests.createTestAccount = async function(params) {

    var webid = ServerUtils.formatJsonTemplate(require('../../templates/account.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT_NAME: params.ACCOUNT_NAME
    });

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "PUT";
    options.json = true;
    options.body = webid;

    var response = await rp(options);
    assert(response.statusCode == 201, 'Account could not be created.');
}

accountTests.deleteTestAccount = async function(params) {

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}`;
    options.method = "DELETE";

    var response = await rp(options);
    assert(response.statusCode == 200 || response.statusCode == 204, 
        'Expected 200 or 204 when deleting account.');
}

module.exports = accountTests;