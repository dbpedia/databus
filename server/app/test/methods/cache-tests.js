const DatabusCache = require("../../common/cache/databus-cache");
const assert = require('assert');
const sparql = require('../../common/queries/sparql');

/**
 * Tests for the DatabusCache class
 */
module.exports = async function cacheTests() {

    console.log(`Testing caching.`);
    var cache = new DatabusCache(60);
    var result = {};

    // normal call
    result = await cache.get('ga', () => sparql.pages.getGlobalActivityChartData());
    assert(result.length > 0);

    // cached call - should be fast
    var startDate = Date.now().valueOf();
    result = await cache.get('ga', () => sparql.pages.getGlobalActivityChartData());
    assert((Date.now().valueOf() - startDate) < 10);
    assert(result.length > 0);

    // cached call without promise - should still return the correct result
    result = await cache.get('ga', () => async function () { });
    assert(result.length > 0);
}
