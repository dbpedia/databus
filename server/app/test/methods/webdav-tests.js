const DatabusWebDAV = require("../../webdav");
const params = require('../test-user.json');
const rp = require('request-promise');
const fs = require('fs');
const assert = require('assert');
const { createTestUser, deleteTestUser } = require("../test-utils");

/**
 * Tests for webDAV calls
 */
module.exports = async function webDAVTests() {

    console.log(`Testing webDAV functions.`);
    var user = await createTestUser();
 
    assert(user.accountName == params.ACCOUNT_NAME);
    var payload = JSON.stringify({ success: true });
 
    var dav = new DatabusWebDAV();
 
    const options = {};
    options.headers = {
       "x-api-key": params.APIKEY
    }
 
    var userDavDirectory = `${dav.directory}${user.accountName}`;
 
    if (fs.existsSync(userDavDirectory)) {
       fs.rmSync(userDavDirectory, { recursive: true, force: true });
    }
 
    var isDirDeleted = !fs.existsSync(userDavDirectory);
 
    assert(isDirDeleted);
 
    try {
 
       options.method = "MKCOL"
       options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/`;
 
       var response = await rp(options);
       assert(response == "");
 
       var davDirectoryExists = fs.existsSync(userDavDirectory);
       assert(davDirectoryExists);
 
       options.method = "PUT";
       options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/upload.json`;
       options.body = payload;
 
       response = await rp(options);
       assert(response == "");
 
       var fileExists = fs.existsSync(`${userDavDirectory}/test/upload.json`);
       assert(fileExists);
 
       options.method = "DELETE";
       options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${user.accountName}/test/`;
 
       response = await rp(options);
       assert(response == "");
 
       await deleteTestUser();
       fs.rmSync(userDavDirectory, { recursive: true, force: true });
 
    } catch (err) {
       console.log(err);
 
       // Cleanup
       await deleteTestUser();
       fs.rmSync(userDavDirectory, { recursive: true, force: true });
 
       assert(err == null);
    }
 }