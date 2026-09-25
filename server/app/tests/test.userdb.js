const { suite } = require('uvu');
const assert = require('uvu/assert');
const DatabusUserDatabase = require('../../userdb');
const ServerUtils = require('../common/utils/server-utils');
const masterAccount = require('./templates/master-account.json');
const test = suite('user-db');

/** @type {DatabusUserDatabase} */
let db;

test.before(async () => {
  ServerUtils.setupRequireExtensions();
  db = new DatabusUserDatabase();
  db.debug = false;
  const connected = await db.connect();
  assert.ok(connected);
  await db.deleteAccount(masterAccount.ACCOUNT_NAME);
  await db.deleteUser(masterAccount.ID);
});

test('getAllUsers does not throw', async () => {
  const users = await db.getAllUsers();
  assert.ok(Array.isArray(users));
});

test('addApiKey fails if user does not exist', async () => {

  await db.deleteUser(masterAccount.ID);

  const user = await db.getUser(masterAccount.ID);
  assert.ok(user == null);

  const added = await db.addApiKey(masterAccount.ACCOUNT_NAME, masterAccount.KEYNAME, masterAccount.APIKEY);
  assert.not(added);
});

test('addUser succeeds', async () => {
  const added = await db.addUser(masterAccount.ID);
  assert.ok(added);
});

test('addAccount succeeds', async () => {
  const added = await db.addAccount(masterAccount.ID, masterAccount.ACCOUNT_NAME);
  assert.ok(added);
});

test('addApiKey succeeds after user exists', async () => {
  const added = await db.addApiKey(masterAccount.ACCOUNT_NAME, masterAccount.KEYNAME, masterAccount.APIKEY);
  assert.ok(added);
});

test('getUser returns correct user', async () => {
  const user = await db.getUser(masterAccount.ID);
  assert.is(user.id, masterAccount.ID);
});

test('deleteUser removes user and api keys', async () => {
  const deleted = await db.deleteUser(masterAccount.ID);
  assert.ok(deleted);

  const apikey = await db.getApiKey(masterAccount.APIKEY);
  assert.ok(apikey == null);
});

test('addUser SQL injection test fails', async () => {
  const injected = await db.addUser('testerman_ones_sub_token;"--');
  assert.not(injected);
});

test.after(async () => {
  try {
    await db.deleteUser(masterAccount.ID);
  } catch (err) {
    console.error(`Cleanup failed for user ${masterAccount.ID}:`, err);
  }
});

test.run();