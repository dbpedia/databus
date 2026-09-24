const { suite } = require('uvu');
const assert = require('uvu/assert');
const axios = require('axios');
const exec = require('../common/execute-query');
const ServerUtils = require('../common/utils/server-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');

ServerUtils.setupRequireExtensions();

const test = suite('secretary-sparql');

const base = 'http://localhost:3000';
const bossName = 'bossacct';
const secretaryName = 'secretary';
const bossUri = `${base}/${bossName}`;
const secretaryUri = `${base}/${secretaryName}`;
const secretaryWebId = `${secretaryUri}#this`;
const resourceUri = `${base}/${bossName}/datasets`;

function request() {
  return {
    databus: {
      accounts: [{ accountName: secretaryName }],
      webIds: [secretaryWebId],
    },
    headers: { 'x-on-behalf-of': `${bossUri}#this` },
  };
}

async function withStubs(select, get, fn) {
  const prevSelect = exec.executeSelect;
  const prevGet = axios.get;
  const prevBase = process.env.DATABUS_RESOURCE_BASE_URL;
  process.env.DATABUS_RESOURCE_BASE_URL = base;
  exec.executeSelect = select;
  axios.get = get;
  try {
    return await fn();
  } finally {
    exec.executeSelect = prevSelect;
    axios.get = prevGet;
    process.env.DATABUS_RESOURCE_BASE_URL = prevBase;
  }
}

test('same-host secretary is resolved from sparql when the account url fetch fails', async () => {
  let fetched = false;
  const allowed = await withStubs(
    async (query) => {
      assert.ok(query.includes(`<${bossUri}#this>`));
      assert.ok(query.includes('databus:agent'));
      return [{
        secretary: 'b1',
        agent: secretaryWebId,
        writeAccess: resourceUri,
      }];
    },
    async () => {
      fetched = true;
      throw new Error('client certificate required');
    },
    () => ServerUtils.hasWriteAccess(request(), bossName, resourceUri),
  );
  assert.ok(allowed);
  assert.is(fetched, false);
});

test('sparql failure falls back to fetching the account url', async () => {
  let fetched = false;
  const expanded = [{
    '@id': `${bossUri}#this`,
    [DatabusUris.DATABUS_SECRETARY_PROPERTY]: [{
      [DatabusUris.DATABUS_AGENT]: [{ '@id': secretaryWebId }],
    }],
  }];
  const allowed = await withStubs(
    async () => null,
    async () => {
      fetched = true;
      return { data: expanded };
    },
    () => ServerUtils.hasWriteAccess(request(), bossName, resourceUri),
  );
  assert.ok(allowed);
  assert.is(fetched, true);
});

test('sparql write-access rows are combined and the account url is not fetched', async () => {
  let fetched = false;
  const allowed = await withStubs(
    async () => [
      { secretary: 'b1', agent: secretaryWebId, writeAccess: `${base}/${bossName}/other` },
      { secretary: 'b1', agent: secretaryWebId, writeAccess: `${base}/${bossName}/datasets` },
    ],
    async () => {
      fetched = true;
      throw new Error('should not fetch');
    },
    () => ServerUtils.hasWriteAccess(request(), bossName, `${resourceUri}/artifact`),
  );
  assert.ok(allowed);
  assert.is(fetched, false);
});

test.run();
