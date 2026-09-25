const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const test_account = require('./templates/test-account.json');
const master_account = require('./templates/master-account.json');

const test = suite('secretary-access');

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

test.before(async () => {
  db = await TestHarness.standardBefore();
});

test('WRITE: non-secretary cannot register on behalf of owner', async () => {
  await TestHarness.assertStatus(
    TestHarness.onBehalfOfRegisterOptions(TestHarness.loadTemplate('group.json')),
    403,
  );
});

test('UPDATE: owner can add secretary to account', async () => {
  await TestHarness.assertStatus(
    TestHarness.updateAccountOptions(TestHarness.addSecretaryBody()),
    200,
  );
});

test('WRITE: secretary can register group on behalf of owner', async () => {
  const res = await rp(TestHarness.onBehalfOfRegisterOptions(TestHarness.loadTemplate('group.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(groupUri()), 200);
});

test('WRITE: secretary can register artifact on behalf of owner', async () => {
  const res = await rp(TestHarness.onBehalfOfRegisterOptions(TestHarness.loadTemplate('artifact.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(artifactUri()), 200);
});

test('WRITE: secretary can register version on behalf of owner', async () => {
  const res = await rp(TestHarness.onBehalfOfRegisterOptions(TestHarness.loadTemplate('version.json')));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 200);
});

test('PUT: secretary can update version on behalf of owner', async () => {
  const body = TestHarness.loadTemplate('version.json');
  body['@graph'].title = 'Updated by secretary';

  const res = await rp(TestHarness.onBehalfOfPutOptions(versionUri(), body));
  assert.is(res.statusCode, 200);
  await TestHarness.assertStatus(TestHarness.getOptions(versionUri()), 200);
});

test('WRITE: secretary cannot act on behalf of unrelated account', async () => {
  const foreignOwner = `${process.env.DATABUS_RESOURCE_BASE_URL}/${master_account.ACCOUNT_NAME}`;
  await TestHarness.assertStatus(
    TestHarness.onBehalfOfRegisterOptions(TestHarness.loadTemplate('group.json'), foreignOwner),
    403,
  );
});

test('UPDATE: owner can restrict secretary to a namespace prefix', async () => {
  await TestHarness.assertStatus(
    TestHarness.updateAccountOptions(TestHarness.addSecretaryBody([test_account.GROUP_NAME])),
    200,
  );
});

test('WRITE: scoped secretary cannot register a group outside the allowed namespace', async () => {
  const body = TestHarness.loadTemplate('group.json');
  body['@graph']['@id'] = `${process.env.DATABUS_RESOURCE_BASE_URL}/${test_account.ACCOUNT_NAME}/othergroup`;

  await TestHarness.assertStatus(
    TestHarness.onBehalfOfRegisterOptions(body),
    403,
  );
});

test('PUT: scoped secretary can still update version under allowed namespace', async () => {
  const body = TestHarness.loadTemplate('version.json');
  body['@graph'].title = 'Updated by scoped secretary';

  const res = await rp(TestHarness.onBehalfOfPutOptions(versionUri(), body));
  assert.is(res.statusCode, 200);
});

test('DELETE: secretary can delete version on behalf of owner', async () => {
  const res = await rp(TestHarness.onBehalfOfDeleteOptions(versionUri()));
  assert.is(res.statusCode, 204);
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
