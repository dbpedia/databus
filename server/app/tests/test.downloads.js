const { suite } = require('uvu');
const assert = require('uvu/assert');
const rp = require('request-promise');
const { setTimeout: sleep } = require('timers/promises');

const TestHarness = require('./utils/test-harness');
const UriUtils = require('../common/utils/uri-utils');
const test_account = require('./templates/test-account.json');

const test = suite('download-counts');

/** @type {import('../../userdb')} */
let db;
let fileUri;

const versionUri = () => UriUtils.createResourceUri([
  test_account.ACCOUNT_NAME,
  test_account.GROUP_NAME,
  test_account.ARTIFACT_NAME,
  test_account.VERSION_NAME,
]);

async function sparql(query) {
  const res = await rp({
    method: 'POST',
    uri: `${process.env.DATABUS_RESOURCE_BASE_URL}/sparql`,
    form: { query },
    headers: { Accept: 'application/sparql-results+json' },
    json: true,
  });
  return res.results.bindings;
}

/** Reads the persisted counts of the test file */
async function getCounts() {
  const rows = await sparql(`PREFIX databus: <https://dataid.dbpedia.org/databus#>
    SELECT ?total ?ui ?api WHERE {
      <${fileUri}> databus:downloadCount ?total ; databus:uiDownloadCount ?ui ; databus:apiDownloadCount ?api .
    }`);
  const row = rows[0];
  return row == null ? null :
    { total: parseInt(row.total.value), ui: parseInt(row.ui.value), api: parseInt(row.api.value) };
}

function download(method = 'GET', headers = {}) {
  return rp({ method, uri: fileUri, headers, followRedirect: false, resolveWithFullResponse: true, simple: false });
}

test.before(async () => {
  db = await TestHarness.standardBefore();
  await rp(TestHarness.registerOptions(TestHarness.loadTemplate('version.json')));

  const rows = await sparql(`PREFIX databus: <https://dataid.dbpedia.org/databus#>
    PREFIX dcat: <http://www.w3.org/ns/dcat#>
    SELECT ?file WHERE { <${versionUri()}> dcat:distribution ?d . ?d databus:file ?file . }`);
  fileUri = rows[0].file.value;
});

test('download requests are counted per file and source, HEAD requests are not', async () => {
  assert.is(await getCounts(), null);

  const res = await download('GET', { Referer: versionUri() });
  assert.is(res.statusCode, 307);
  await download('GET');
  await download('GET', { Referer: 'https://example.org/some/page' });
  await download('HEAD');

  // Counts are persisted after the flush interval (1s in tests)
  let counts = null;
  for (let i = 0; i < 20 && counts?.total != 3; i++) {
    await sleep(500);
    counts = await getCounts();
  }

  assert.equal(counts, { total: 3, ui: 1, api: 2 });
});

test('prometheus endpoint exposes the counts per source', async () => {
  const metrics = await rp(`http://localhost:${process.env.METRICS_PORT}/metrics`);
  const value = (source) => {
    const line = metrics.split('\n').find(l => l.startsWith('databus_downloads{')
      && l.includes(`file="${fileUri}"`) && l.includes(`source="${source}"`));
    return line == null ? null : parseInt(line.split(' ').pop());
  };

  assert.is(value('ui'), 1);
  assert.is(value('api'), 2);
});

test('requests on unknown files are not counted', async () => {
  const res = await rp({
    uri: `${versionUri()}/does-not-exist.ttl`, followRedirect: false, resolveWithFullResponse: true, simple: false
  });
  assert.is(res.statusCode, 404);
  const rows = await sparql(`SELECT ?c WHERE { <${versionUri()}/does-not-exist.ttl> ?p ?c }`);
  assert.is(rows.length, 0);
});

test.after(async () => {
  await rp(TestHarness.deleteOptions(versionUri()));
  await TestHarness.standardAfter(db);
});

test.run();
