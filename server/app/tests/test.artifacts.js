const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const N3 = require('n3');
const { Parser } = N3;

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const test_account = require('./templates/test-account.json');

const test = suite('artifact-crud');

/** @type {import('../../userdb')} */
let db;

const artifactUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
]);

const groupUri = () => UriUtils.createResourceUri([test_account.ACCOUNT_NAME, test_account.GROUP_NAME]);

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('READ: artifact should not exist initially', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(artifactUri()), 404);
});

// ArtifactWriter emits a stub group graph when no group was registered first
test('CREATE: artifact can be created', async () => {
  const res = await rp(TestHarness.registerOptions(TestHarness.loadTemplate('artifact.json')));
  assert.is(res.statusCode, 200);
});

test('READ: artifact exists after creation', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(artifactUri()), 200);
});

test('READ GROUP TURTLE: group can be read as turtle and turtle contains link to artifact', async () => {
  const res = await rp(TestHarness.getOptions(groupUri(), 'text/turtle'));
  assert.is(res.statusCode, 200);

  const quads = new Parser().parse(res.body);
  assert.ok(quads.length > 0);
  assert.ok(
    quads.some(q => q.predicate.value === DatabusUris.DATABUS_HAS_ARTIFACT),
    'Turtle should contain databus:hasArtifact'
  );
});

test('DELETE: deleting non-empty group returns conflict', async () => {
  await TestHarness.assertStatus(TestHarness.deleteOptions(groupUri()), 409);
});

test('DELETE: artifact can be deleted', async () => {
  const res = await rp(TestHarness.deleteOptions(artifactUri()));
  assert.is(res.statusCode, 204);
});

test('READ: artifact is gone after deletion', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(artifactUri()), 404);
});

test.after(async () => {
  for (const uri of [artifactUri(), groupUri()]) {
    try {
      await rp(TestHarness.deleteOptions(uri));
    } catch (err) {
      if (![204, 404, 409].includes(err.response?.statusCode)) throw err;
    }
  }
  await TestHarness.standardAfter(db);
});

test.run();
