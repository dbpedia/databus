const params = require('../../test-user.json');
const rp = require('request-promise');
const suite = require('../../../api/lib/databus-tractate-suite');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const { autocomplete } = require('../../../api/lib/dataid-autocomplete');
const jsonld = require('jsonld');
const DatabusUris = require('../../../../../public/js/utils/databus-uris');

/**
 * Tests for generating tractates and verifying signatures
 */
module.exports = async function tractateTests() {

    const options = {};
    options.headers = { "x-api-key": params.APIKEY };
    options.resolveWithFullResponse = true;


    // Format input data
    var testMetadata = ServerUtils.formatJsonTemplate(require('../../templates/dataid.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params.ACCOUNT_NAME,
    });

    // ========= Generate Databus Tractate v1 ===========
    options.method = "POST";
    options.headers = { 'Accept': 'text/plain' }
    options.json = true;
    options.body = testMetadata;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/canonicalize`;

    response = await rp(options);
    assert(response.statusCode == 200, 'Could not generate Databus Tractate v1.');


    // Expand graph, autocomplete, create proof
    var expandedData = autocomplete(await jsonld.flatten(await jsonld.expand(testMetadata)));
    var proof = suite.createProof(expandedData);
    testMetadata[DatabusUris.JSONLD_GRAPH][DatabusUris.SEC_PROOF] = proof;

    // ========= Validate Databus Tractate v1 ===========
    options.headers = { 'Accept': 'application/json' }
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/verify`;

    response = await rp(options);
    assert(response.statusCode == 200 && response.body.success == true, response.body.message);
}