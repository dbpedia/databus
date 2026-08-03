const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const test_account = require('./templates/test-account.json');

const test = suite('collection-crud');

/** @type {import('../../userdb')} */
let db;

const collectionUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  'collections',
  test_account.COLLECTION_NAME,
]);

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('READ: collection should not exist initially', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(collectionUri()), 404);
});

test('CREATE: collection can be created', async () => {
  const res = await rp(TestHarness.registerOptions(TestHarness.loadTemplate('collection.json')));
  assert.is(res.statusCode, 200);
});

test('READ: collection exists after creation', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(collectionUri()), 200);
});

test('GET SPARQL: collection sparql can be read', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(collectionUri(), 'text/sparql'), 200);
});

test('DELETE: collection can be deleted', async () => {
  const res = await rp(TestHarness.deleteOptions(collectionUri()));
  assert.is(res.statusCode, 204);
});

test('READ: collection is gone after deletion', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(collectionUri()), 404);
});

test.after(async () => {
  try {
    await rp(TestHarness.deleteOptions(collectionUri()));
  } catch (err) {
    if (![204, 404].includes(err.response?.statusCode)) throw err;
  }
  await TestHarness.standardAfter(db);
});

test.run();
