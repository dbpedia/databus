const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const N3 = require('n3');
const { Parser } = N3;

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const test_account = require('./templates/test-account.json');

const test = suite('version-crud');

/** @type {import('../../userdb')} */
let db;

const versionUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
  test_account.VERSION_NAME,
]);

const artifactUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
]);

const groupUri = () => UriUtils.createResourceUri([test_account.ACCOUNT_NAME, test_account.GROUP_NAME]);

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('READ: version should not exist initially', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 404);
});

// Version-only register: construct query materializes parent group + artifact
test('CREATE: version can be created', async () => {
  const res = await rp(TestHarness.registerOptions(TestHarness.loadTemplate('version.json')));
  assert.is(res.statusCode, 200);
});

test('READ: version exists after creation', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 200);
});

test('READ ARTIFACT TURTLE: artifact can be read as turtle and turtle contains link to version', async () => {
  const res = await rp(TestHarness.getOptions(artifactUri(), 'text/turtle'));
  assert.is(res.statusCode, 200);

  const quads = new Parser().parse(res.body);
  assert.ok(quads.some(q => q.predicate.value === DatabusUris.DATABUS_HAS_VERSION));
});

test('DELETE: deleting non-empty group returns conflict', async () => {
  await TestHarness.assertStatus(TestHarness.deleteOptions(groupUri()), 409);
});

test('DELETE: deleting non-empty artifact returns conflict', async () => {
  await TestHarness.assertStatus(TestHarness.deleteOptions(artifactUri()), 409);
});

test('DELETE: version can be deleted', async () => {
  const res = await rp(TestHarness.deleteOptions(versionUri()));
  assert.is(res.statusCode, 204);
});

test('READ: version is gone after deletion', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 404);
});

test.after(async () => {
  for (const uri of [versionUri(), artifactUri(), groupUri()]) {
    try {
      await rp(TestHarness.deleteOptions(uri));
    } catch (err) {
      if (![204, 404, 409].includes(err.response?.statusCode)) throw err;
    }
  }
  await TestHarness.standardAfter(db);
});

test.run();
