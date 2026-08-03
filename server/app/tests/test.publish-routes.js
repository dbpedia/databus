const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const test_account = require('./templates/test-account.json');

const test = suite('publish-routes');

/** @type {import('../../userdb')} */
let db;

const groupUri = () => UriUtils.createResourceUri([test_account.ACCOUNT_NAME, test_account.GROUP_NAME]);
const artifactUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
]);
const versionUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
  test_account.VERSION_NAME,
]);
const collectionUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  'collections',
  test_account.COLLECTION_NAME,
]);

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('PUT group creates resource', async () => {
  const res = await rp(TestHarness.putOptions(groupUri(), TestHarness.loadTemplate('group.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 200);
});

test('PUT artifact creates resource', async () => {
  const res = await rp(TestHarness.putOptions(artifactUri(), TestHarness.loadTemplate('artifact.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(artifactUri()), 200);
});

test('PUT version creates resource', async () => {
  const res = await rp(TestHarness.putOptions(versionUri(), TestHarness.loadTemplate('version.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 200);
});

test('PUT collection creates resource', async () => {
  const res = await rp(TestHarness.putOptions(collectionUri(), TestHarness.loadTemplate('collection.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(collectionUri()), 200);
});

test('register and PUT update the same group', async () => {
  const body = TestHarness.loadTemplate('group.json');
  body['@graph'].title = 'Updated via PUT';

  const res = await rp(TestHarness.putOptions(groupUri(), body));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 200);
});

test('wrong API key returns 401 on PUT', async () => {
  await TestHarness.assertStatus({
    method: 'PUT',
    uri: groupUri(),
    headers: { 'x-api-key': 'invalid-key' },
    json: true,
    resolveWithFullResponse: true,
    body: TestHarness.loadTemplate('group.json'),
  }, 401);
});

test.after(async () => {
  for (const uri of [versionUri(), artifactUri(), groupUri(), collectionUri()]) {
    try {
      await rp(TestHarness.deleteOptions(uri));
    } catch (err) {
      if (![204, 404, 409].includes(err.response?.statusCode)) throw err;
    }
  }
  await TestHarness.standardAfter(db);
});

test.run();
