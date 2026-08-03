const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');

const TestHarness = require('./utils/test-harness');
const DatabusUserTestUtils = require('./utils/userdb-utils');
const test_account = require('./templates/test-account.json');
const master_account = require('./templates/master-account.json');

const test = suite('account-tests');

/** @type {import('../../userdb')} */
let db;

test.before(async () => {
  db = await TestHarness.connectDb();
  await TestHarness.setupMaster(db);
  await TestHarness.deleteTestAccountIfExists();
});

test('GET non-existing account returns 404', async () => {
  await TestHarness.assertStatus({
    headers: { 'x-api-key': master_account.APIKEY, Accept: 'application/ld+json' },
    resolveWithFullResponse: true,
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/${test_account.ACCOUNT_NAME}`,
    method: 'GET',
  }, 404);
});

test('CREATE account returns 200', async () => {
  await TestHarness.createTestAccount();
  await DatabusUserTestUtils.insertApiKey(db, test_account);
});

test('SEARCH account by label returns 200', async () => {
  const accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${test_account.ACCOUNT_NAME}`;
  await TestHarness.waitForSearchHit('Test Label', accountUri);
});

test('GET created account returns 200', async () => {
  await TestHarness.assertStatus({
    headers: { 'x-api-key': master_account.APIKEY, Accept: 'application/ld+json' },
    resolveWithFullResponse: true,
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/${test_account.ACCOUNT_NAME}`,
    method: 'GET',
  }, 200);
});

test('UPDATE account returns 200', async () => {
  await TestHarness.assertStatus({
    headers: { 'x-api-key': master_account.APIKEY },
    resolveWithFullResponse: true,
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/update`,
    method: 'POST',
    json: true,
    body: {
      accountName: test_account.ACCOUNT_NAME,
      label: 'Updated Label',
      status: 'active',
    },
  }, 200);
});

test('Cannot create API key for someone else', async () => {
  await TestHarness.assertStatus({
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/api-key/create`,
    headers: { 'x-api-key': test_account.APIKEY },
    resolveWithFullResponse: true,
    method: 'POST',
    json: true,
    body: { accountName: 'janfo', keyname: 'testkey' },
  }, 403);
});

test('API key create and delete tests', async () => {
  const createOptions = {
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/api-key/create`,
    headers: { 'x-api-key': test_account.APIKEY },
    resolveWithFullResponse: true,
    method: 'POST',
    json: true,
    body: { accountName: test_account.ACCOUNT_NAME, keyname: 'testkey2' },
  };

  let response = await rp(createOptions);
  assert.is(response.statusCode, 200);

  try {
    await rp(createOptions);
    assert.unreachable('Creating already existing API key should fail');
  } catch (err) {
    assert.is(err.response?.statusCode, 400);
  }

  createOptions.uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/api-key/delete`;
  response = await rp(createOptions);
  assert.is(response.statusCode, 200);

  response = await rp(createOptions);
  assert.is(response.statusCode, 204);
});

test('DELETE account returns 200 and 404 when deleting again', async () => {
  const options = {
    headers: { 'x-api-key': master_account.APIKEY },
    resolveWithFullResponse: true,
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/api/account/delete`,
    method: 'POST',
    json: true,
    body: { accountName: test_account.ACCOUNT_NAME },
  };

  await rp(options);

  await TestHarness.assertStatus(options, 404);
});

test.after(async () => {
  await TestHarness.standardAfter(db);
});

test.run();
