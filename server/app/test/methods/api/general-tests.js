const params = require('../../test-user.json');
const params_nerd = require('../../test-user-nerd.json');
const rp = require('request-promise');
const assert = require('assert');
const ServerUtils = require('../../../common/utils/server-utils');
const { version } = require('../../../../config.json');

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

    var manifest = ServerUtils.formatJsonTemplate(require('../../../../manifest-template.ttl'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        DATABUS_VERSION: version
    });

    assert(response == manifest, "Manifest is not well-formed.");
}

async function publishTest() {

    const options = {};

    // // ======== Publish Dataid =======
    // options.method = "POST";
    // options.headers = { "x-api-key": params.APIKEY };
    // options.resolveWithFullResponse = true;
    // options.json = true;
    // options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/publish`;
    // options.body = ServerUtils.formatJsonTemplate(require('../../templates/version.json'), {
    //     DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
    //     ACCOUNT: params.ACCOUNT_NAME,
    //     GROUP: params.GROUP_NAME,
    //     ARTIFACT: params.ARTIFACT_NAME,
    //     VERSION: params.VERSION_NAME
    // });

    // response = await rp(options);
    // assert(response.statusCode == 200, 'Metadata could not be published.');


    // // ========= Delete Version ===========
    // delete options.headers;
    // options.method = "DELETE";
    // options.headers = { "x-api-key": params.APIKEY };
    // options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params.ACCOUNT_NAME}/${params.GROUP_NAME}/${params.ARTIFACT_NAME}/${params.VERSION_NAME}`;

    // response = await rp(options);
    // assert(response.statusCode == 204, `Could not delete version ${options.uri}.`);

    // ======== Publish Dataid =======
    options.method = "POST";
    options.headers = { "x-api-key": params_nerd.APIKEY };
    options.resolveWithFullResponse = true;
    options.json = true;
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/publish`;
    options.body = ServerUtils.formatJsonTemplate(require('../../templates/version.json'), {
        DATABUS_RESOURCE_BASE_URL: process.env.DATABUS_RESOURCE_BASE_URL,
        ACCOUNT: params_nerd.ACCOUNT_NAME,
        GROUP: params_nerd.GROUP_NAME,
        ARTIFACT: params_nerd.ARTIFACT_NAME,
        VERSION: params_nerd.VERSION_NAME
    });

    let response = await rp(options);
    assert(response.statusCode == 200, 'Nerdy metadata could not be published.');

    // ======== Publish invalid Dataid =======
    delete options.body;
    try{
        response = await rp(options);
        assert(false, 'should not be possible to publish non existent metadata')
    } catch(err) {
        assert(err.response.statusCode == 400, 'empty metadata shoud not be publishibly.');
    }

//     search doesnt work
//     Error: connect ECONNREFUSED 127.0.0.1:8082
//     at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1247:16) {
//   errno: -111,
//   code: 'ECONNREFUSED',
//   syscall: 'connect',
//   address: '127.0.0.1',
//   port: 8082
// }
    // // ========= Search Tests ===========
    // // ========= Search existing Data ===========
    // options.method = "GET";
    // options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/search?query=${params_nerd.ARTIFACT_NAME}&typeName=Artifact&partRequired=true`;

    // response = await rp(options);
    // assert(response.statusCode == 200, "couldnt find test artifact")

    // // ========= Search non existing Data =========


    // ========= Delete published Data ===========
    delete options.headers;
    options.method = "DELETE";
    options.headers = { "x-api-key": params_nerd.APIKEY };
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${params_nerd.ACCOUNT_NAME}/${params_nerd.GROUP_NAME}/${params_nerd.ARTIFACT_NAME}/${params_nerd.VERSION_NAME}`;

    response = await rp(options);
    assert(response.statusCode == 204, `Could not delete version ${options.uri}.`);


    // ======== send sparql request ===========
    options.method = "POST";
    options.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/sparql`;
    options.body = { query: "select distinct * where {?a ?b ?c} LIMIT 2" }

    response = await rp(options);
    assert(response.statusCode == 200, 'fail')

    // ========= send invalid sparql request =========
    options.body = { query: "asd" }
    
    try{
        await rp(options);
        assert(false, 'invalid sparql query shouldnt work.')
    } catch(err) {
        assert(err.response.statusCode == 400, "invalid sparql query shouldnt work.")
    }

}
