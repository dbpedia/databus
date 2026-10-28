// Black-box smoke tests against a running Databus container. Started by app/image-test.runner.js.
const { suite } = require('uvu');
const assert = require('uvu/assert');

const base = process.env.DATABUS_RESOURCE_BASE_URL;
const get = (path, accept = 'text/html') => fetch(base + path, { headers: { accept } });

const pages = suite('pages');

for (const path of ['/', '/about', '/imprint', '/sparql', '/api']) {
  pages(`GET ${path} renders HTML`, async () => {
    const res = await get(path);
    assert.is(res.status, 200);
    assert.match(res.headers.get('content-type'), 'text/html');
  });
}

pages('home page shows the configured name', async () => {
  assert.match(await (await get('/')).text(), process.env.DATABUS_NAME);
});

pages('unknown account is a 404', async () => {
  assert.is((await get('/no-such-account-smoke')).status, 404);
});

pages('publish wizard requires login', async () => {
  assert.is((await get('/app/publish-wizard')).status, 401);
});

const assets = suite('static assets');

for (const path of [
  '/dist/main.js',
  '/css/website.css',
  '/node_modules/jquery/dist/jquery.min.js',
  '/node_modules/angular/angular.min.js',
  '/node_modules/codemirror/lib/codemirror.js',
]) {
  assets(`GET ${path}`, async () => {
    const res = await get(path, '*/*');
    assert.is(res.status, 200);
    assert.ok((await res.arrayBuffer()).byteLength > 0);
  });
}

assets('jsonld context is served as ld+json', async () => {
  const res = await get('/res/context.jsonld', 'application/ld+json');
  assert.is(res.status, 200);
  assert.match(res.headers.get('content-type'), 'application/ld+json');
  assert.ok((await res.json())['@context']);
});

assets('shacl shapes are served as turtle', async () => {
  const res = await get('/res/shacl/version.shacl', '*/*');
  assert.is(res.status, 200);
  assert.match(res.headers.get('content-type'), 'text/turtle');
});

const api = suite('api');

api('SPARQL query is proxied to the database', async () => {
  const res = await fetch(`${base}/sparql`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/sparql-results+json' },
    body: new URLSearchParams({ query: 'SELECT * WHERE { ?s ?p ?o } LIMIT 1' }),
  });
  assert.is(res.status, 200);
  assert.ok((await res.json()).results);
});

api('search is proxied to lookup', async () => {
  const res = await get('/api/search?query=smoke', 'application/json');
  assert.is(res.status, 200);
  assert.ok(Array.isArray((await res.json()).docs));
});

api('account creation requires authentication', async () => {
  const res = await fetch(`${base}/api/account/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ accountName: 'smoke' }),
  });
  assert.ok([401, 403].includes(res.status), `got ${res.status}`);
});

api('publish requires authentication', async () => {
  const res = await fetch(`${base}/api/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/ld+json', accept: 'application/json' },
    body: '{}',
  });
  assert.ok([401, 403].includes(res.status), `got ${res.status}`);
});

pages.run();
assets.run();
api.run();
