const DatabusUtils = require("../../../../public/js/utils/databus-utils");
const UriUtils = require("../../common/utils/uri-utils");
const assert = require('assert');

/**
 * Tests for util functions
 */
module.exports = async function utilTests() {

    console.log(`Testing util functions.`);
 
    // objSize
    var obj = { one: 1, two: 2 };
    assert(DatabusUtils.objSize(obj) == 2);
    assert(DatabusUtils.objSize({}) == 0);
    assert(DatabusUtils.objSize(null) == 0);
 
    // uniqueList
    var list = [0, 1, 1, 2, 2];
    var uniqueList = DatabusUtils.uniqueList(list);
    assert(uniqueList.length == 3);
    assert(uniqueList[0] == 0);
    assert(uniqueList[1] == 1);
    assert(uniqueList[2] == 2);
 
    // uriToName
    assert(UriUtils.uriToName('https://example.org/test/my-name') == 'my-name');
    assert(UriUtils.uriToName('https://example.org/test/my-name#tag') == 'tag');
 }