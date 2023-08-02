const DatabusCache = require("../../common/cache/databus-cache");
const assert = require('assert');
const sparql = require('../../common/queries/sparql');
const rp = require('request-promise');
const Constants = require("../../common/constants");

/**
 * Tests for the DatabusCache class
 */
module.exports = async function resourceTests() {

    console.log(`Testing resources.`);

    var options = {};
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}${Constants.DATABUS_DEFAULT_CONTEXT_PATH}`;
    options.method = "GET";
    options.headers = {};
    options.resolveWithFullResponse = true;

    options.headers['Accept'] = "application/ld+json"

    var res = await rp(options);
    assert(res.statusCode == 200, 'Expected 200 when retrieving context.');
}
