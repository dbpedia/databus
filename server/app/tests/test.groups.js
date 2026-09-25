const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const N3 = require('n3');
const { Parser } = N3;

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const test_account = require('./templates/test-account.json');

const test = suite('group-crud');

/** @type {import('../../userdb')} */
let db;

const groupUri = () => UriUtils.createResourceUri([test_account.ACCOUNT_NAME, test_account.GROUP_NAME]);

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('READ: group should not exist initially', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 404);
});

test('CREATE: group can be created', async () => {
  const res = await rp(TestHarness.registerOptions(TestHarness.loadTemplate('group.json')));
  assert.is(res.statusCode, 200);
});

test('READ: group exists after creation', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 200);
});

test('READ AS TURTLE: group can be read as turtle and turtle ends with a newline character', async () => {
  const res = await rp(TestHarness.getOptions(groupUri(), 'text/turtle'));
  assert.is(res.statusCode, 200);
  assert.ok(res.body.endsWith('\n'), 'Turtle response should end with a newline');

  const quads = new Parser().parse(res.body);
  assert.ok(quads.length > 0, 'Turtle should contain at least one triple');
});

test('DELETE: group can be deleted', async () => {
  const res = await rp(TestHarness.deleteOptions(groupUri()));
  assert.is(res.statusCode, 204);
});

test('READ: group is gone after deletion', async () => {
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 404);
});

test.after(async () => {
  try {
    await rp(TestHarness.deleteOptions(groupUri()));
  } catch (err) {
    if (![204, 404].includes(err.response?.statusCode)) throw err;
  }
  await TestHarness.standardAfter(db);
});

test.run();
