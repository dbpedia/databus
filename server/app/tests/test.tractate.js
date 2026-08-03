const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const jsonld = require('jsonld');

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const suiteUtils = require('../api/lib/databus-tractate-suite');
const { autocomplete } = require('../api/lib/dataid-autocomplete');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const test_account = require('./templates/test-account.json');

const test = suite('tractate-tests');

/** @type {import('../../userdb')} */
let db;
let testMetadata;

test.before(async () => {
  db = await TestHarness.standardBefore();
  testMetadata = TestHarness.loadTemplate('version.json');
});

test('generate Databus Tractate v1', async () => {
  const response = await rp({
    method: 'POST',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/canonicalize`,
    headers: { Accept: 'text/plain' },
    resolveWithFullResponse: true,
    json: true,
    body: testMetadata,
  });

  assert.is(response.statusCode, 200);
  const lines = response.body.split('\n');
  assert.is(
    lines[1],
    `${process.env.DATABUS_RESOURCE_BASE_URL}/${test_account.ACCOUNT_NAME}/${test_account.GROUP_NAME}/${test_account.ARTIFACT_NAME}/${test_account.VERSION_NAME}`
  );
});

test('verify Databus Tractate v1', async () => {
  const expandedData = autocomplete(await jsonld.flatten(await jsonld.expand(testMetadata)));
  const proof = suiteUtils.createProof(expandedData);
  testMetadata[DatabusUris.JSONLD_GRAPH][DatabusUris.SEC_PROOF] = proof;

  const response = await rp({
    method: 'POST',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/tractate/v1/verify`,
    headers: { Accept: 'application/json' },
    resolveWithFullResponse: true,
    json: true,
    body: testMetadata,
  });

  assert.is(response.statusCode, 200);
  assert.ok(response.body.success, response.body.message);
});

test.after(async () => {
  await TestHarness.standardAfter(db);
});

test.run();
