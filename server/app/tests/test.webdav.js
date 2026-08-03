const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const fs = require('fs');

const TestHarness = require('./utils/test-harness');
const DatabusUserTestUtils = require('./utils/userdb-utils');
const DatabusWebDAV = require('../api/webdav');
const test_account = require('./templates/test-account.json');

const test = suite('webDAV');

/** @type {import('../../userdb')} */
let db;
/** @type {DatabusWebDAV} */
let dav;
/** @type {string} */
let userDavDirectory;

test.before(async () => {
  db = await TestHarness.connectDb();
  await TestHarness.setupMaster(db);
  await TestHarness.deleteTestAccountIfExists();
  await TestHarness.createTestAccount();
  await DatabusUserTestUtils.insertApiKey(db, test_account);

  dav = new DatabusWebDAV();
  userDavDirectory = `${dav.directory}${test_account.ACCOUNT_NAME}`;

  if (fs.existsSync(userDavDirectory)) {
    fs.rmSync(userDavDirectory, { recursive: true, force: true });
  }
});

test('MKCOL creates directory', async () => {
  const response = await rp({
    method: 'MKCOL',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${test_account.ACCOUNT_NAME}/test/`,
    headers: { 'x-api-key': test_account.APIKEY },
  });
  assert.is(response, '');
  assert.ok(fs.existsSync(userDavDirectory));
});

test('PUT uploads a file', async () => {
  const payload = JSON.stringify({ success: true });
  const response = await rp({
    method: 'PUT',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${test_account.ACCOUNT_NAME}/test/upload.json`,
    headers: { 'x-api-key': test_account.APIKEY },
    body: payload,
  });
  assert.is(response, '');
  assert.ok(fs.existsSync(`${userDavDirectory}/test/upload.json`));
});

test('DELETE empties directory', async () => {
  const response = await rp({
    method: 'DELETE',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/dav/${test_account.ACCOUNT_NAME}/test/`,
    headers: { 'x-api-key': test_account.APIKEY },
  });
  assert.is(response, '');
  const files = fs.existsSync(userDavDirectory) ? fs.readdirSync(userDavDirectory) : [];
  assert.is(files.length, 0);
});

test.after(async () => {
  await TestHarness.standardAfter(db);
  if (fs.existsSync(userDavDirectory)) {
    fs.rmSync(userDavDirectory, { recursive: true, force: true });
  }
});

test.run();
