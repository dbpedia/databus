/**
 * AI-generated embedded store to run tests
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const jsonld = require('jsonld');
const { Store, namedNode } = require('oxigraph');
const rdfParser = require('rdf-parse').default;
const streamify = require('streamify-string');
const { dataset } = require('@rdfjs/dataset');
const SHACLValidator = require('rdf-validate-shacl');

const contextDoc = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../../common/res/context.jsonld'), 'utf8'));

jsonld.documentLoader = async (url) => {
  if (String(url).endsWith('/res/context.jsonld')) {
    return { contextUrl: null, document: contextDoc, documentUrl: url };
  }
  throw new Error(`No local context for ${url}`);
};

const store = new Store();
const docs = new Map();
let chain = Promise.resolve();

function locked(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});
  return run;
}

const docKey = (repo, docPath) => `${repo}\0${docPath}`;
const graphIri = (repo, docPath) =>
  `http://gstore.local/${encodeURIComponent(repo)}/${encodeURIComponent(docPath)}`;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, body, type) {
  const payload = body == null || body === ''
    ? ''
    : (typeof body === 'string' ? body : JSON.stringify(body));
  const headers = {};
  if (type && payload) headers['Content-Type'] = type;
  res.writeHead(status, headers);
  res.end(payload);
}

function queryKind(query) {
  const stripped = query.replace(/#[^\n]*/g, ' ').replace(/prefix\s+\w*:\s*<[^>]*>/gi, ' ');
  const match = /\b(SELECT|ASK|CONSTRUCT|DESCRIBE)\b/i.exec(stripped);
  return match ? match[1].toUpperCase() : 'SELECT';
}

function resultFormat(accept, kind) {
  const a = (accept || '').split(',')[0].split(';')[0].trim().toLowerCase();
  if (a.includes('turtle') || a === 'text/sparql' || a.endsWith('/n3')) return 'text/turtle';
  if (a.includes('n-triples') || a === 'text/plain') return 'application/n-triples';
  if (a.includes('rdf+xml')) return 'application/rdf+xml';
  if (a.includes('ld+json') || kind === 'CONSTRUCT' || kind === 'DESCRIBE') return 'application/ld+json';
  return 'application/sparql-results+json';
}

async function saveDoc(repo, docPath, prefix, raw) {
  const doc = JSON.parse(raw);
  const nquads = await jsonld.toRDF(doc, {
    format: 'application/n-quads',
    base: prefix || undefined,
  });
  const iri = graphIri(repo, docPath);
  store.update(`DROP SILENT GRAPH <${iri}>`);
  if (nquads.trim()) {
    store.load(nquads, { format: 'application/n-quads', to_graph_name: namedNode(iri) });
  }
  docs.set(docKey(repo, docPath), doc);
}

function deleteDoc(repo, docPath) {
  store.update(`DROP SILENT GRAPH <${graphIri(repo, docPath)}>`);
  docs.delete(docKey(repo, docPath));
}

function normalizeSparql(query) {
  // Virtuoso accepts `SELECT ?a AS ?b`. SPARQL 1.1 requires parentheses.
  return query.replace(
    /(^|[\s,])(\?[A-Za-z_][\w]*)\s+as\s+(\?[A-Za-z_][\w]*)/gi,
    '$1($2 AS $3)',
  );
}

function termToNTriples(term) {
  if (term.termType === 'NamedNode') return `<${term.value}>`;
  if (term.termType === 'BlankNode') return `_:${term.value}`;
  const escaped = term.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  if (term.language) return `"${escaped}"@${term.language}`;
  if (term.datatype && term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
    return `"${escaped}"^^<${term.datatype.value}>`;
  }
  return `"${escaped}"`;
}

function nestBlanks(nodes) {
  const blanks = new Map();
  const referenced = new Set();
  for (const node of nodes) {
    if (node['@id'] && node['@id'].startsWith('_:')) blanks.set(node['@id'], node);
  }
  const inline = (value, stack) => {
    if (Array.isArray(value)) return value.map((item) => inline(item, stack));
    if (!value || typeof value !== 'object') return value;
    if (value['@id'] && value['@id'].startsWith('_:') && Object.keys(value).length === 1) {
      referenced.add(value['@id']);
      if (stack.has(value['@id'])) return { '@id': value['@id'] };
      const node = blanks.get(value['@id']);
      if (!node) return value;
      stack.add(value['@id']);
      const nested = {};
      for (const key of Object.keys(node)) {
        if (key === '@id') continue;
        nested[key] = inline(node[key], stack);
      }
      stack.delete(value['@id']);
      return nested;
    }
    const copy = { ...value };
    for (const key of Object.keys(copy)) copy[key] = inline(copy[key], stack);
    return copy;
  };
  return nodes
    .map((node) => inline(node, new Set()))
    .filter((node) => !node['@id'] || !node['@id'].startsWith('_:') || !referenced.has(node['@id']));
}

async function constructJsonLd(query) {
  const quads = store.query(query, { use_default_graph_as_union: true });
  if (!quads.length) return '[]';
  const nquads = quads.map((quad) =>
    `${termToNTriples(quad.subject)} ${termToNTriples(quad.predicate)} ${termToNTriples(quad.object)} .`).join('\n');
  return JSON.stringify(nestBlanks(await jsonld.fromRDF(nquads, { format: 'application/n-quads' })));
}

async function runSparql(query, accept) {
  const normalized = normalizeSparql(query);
  const format = resultFormat(accept, queryKind(normalized));
  if (format === 'application/ld+json') {
    return { body: await constructJsonLd(normalized), type: format };
  }
  let body = store.query(normalized, {
    use_default_graph_as_union: true,
    results_format: format,
  });
  if (typeof body !== 'string') body = String(body);
  if ((format === 'text/turtle' || format === 'application/n-triples') && !body.endsWith('\n')) {
    body += '\n';
  }
  const type = format === 'application/sparql-results+json' && !(accept || '').includes('sparql-results')
    ? 'application/json'
    : format;
  return { body, type };
}

function parseMultipart(buf, contentType) {
  let boundary = (/boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || '') || [])[1]
    || (/boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || '') || [])[2];
  const text = buf.toString('utf8');
  if (!boundary) {
    const first = /^--([^\r\n]+)/.exec(text);
    boundary = first && first[1];
  }
  if (!boundary) throw new Error('missing multipart boundary');
  const fields = {};
  for (const part of text.split('--' + boundary)) {
    const name = /name="([^"]+)"/.exec(part);
    if (!name) continue;
    const split = part.indexOf('\r\n\r\n');
    if (split < 0) continue;
    let value = part.slice(split + 4);
    if (value.endsWith('\r\n')) value = value.slice(0, -2);
    fields[name[1]] = value;
  }
  return fields;
}

function quadsFrom(data, contentType) {
  return new Promise((resolve, reject) => {
    const quads = [];
    rdfParser.parse(streamify(data), { contentType })
      .on('data', (quad) => quads.push(quad))
      .on('error', reject)
      .on('end', () => resolve(quads));
  });
}

async function validateShacl(graphJson, shaclTurtle) {
  const shapes = dataset();
  for (const quad of await quadsFrom(shaclTurtle, 'text/turtle')) shapes.add(quad);
  // ponytail: rdf-validate-shacl has no sh:sparql. Those constraints are dropped.
  // Jena (gstore) still enforces them in production.
  const SH_SPARQL = 'http://www.w3.org/ns/shacl#sparql';
  const dropped = new Set();
  for (const quad of [...shapes]) {
    if (quad.predicate.value === SH_SPARQL) {
      dropped.add(quad.object.value);
      shapes.delete(quad);
    }
  }
  for (const quad of [...shapes]) {
    if (dropped.has(quad.subject.value)) shapes.delete(quad);
  }
  const data = dataset();
  for (const quad of await quadsFrom(graphJson, 'application/ld+json')) data.add(quad);
  const report = new SHACLValidator(shapes).validate(data);
  const results = report.results.map((result) => ({
    '@type': 'sh:ValidationResult',
    'sh:resultMessage': result.message.map((term) => term.value).filter(Boolean).join('\n') || 'does not conform',
  }));
  return {
    '@context': { sh: 'http://www.w3.org/ns/shacl#' },
    '@type': 'sh:ValidationReport',
    'sh:conforms': report.conforms,
    ...(results.length ? { 'sh:result': results } : {}),
  };
}

// label scan over the account graph
function search(query) {
  const rows = store.query(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?account ?label WHERE {
      ?person foaf:account ?account .
      ?person foaf:name ?label .
    }
  `, { use_default_graph_as_union: true });
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const hits = [];
  const seen = new Set();
  for (const row of rows) {
    const account = row.get('account').value;
    const label = row.get('label').value;
    if (seen.has(account)) continue;
    const hay = label.toLowerCase();
    if (tokens.length && !tokens.every((token) => hay.includes(token))) continue;
    seen.add(account);
    hits.push({ id: [account], label: [label], typeName: ['Account'] });
  }
  return { docs: hits };
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const { pathname } = url;

  if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/') {
    send(res, 200, req.method === 'HEAD' ? '' : 'ok', 'text/plain');
    return;
  }

  if (pathname === '/document/read' || pathname === '/graph/read') {
    const doc = docs.get(docKey(url.searchParams.get('repo'), url.searchParams.get('path')));
    if (!doc) {
      send(res, 404, 'not found', 'text/plain');
      return;
    }
    send(res, 200, req.method === 'HEAD' ? '' : doc, 'application/ld+json');
    return;
  }

  if (pathname === '/document/save' && req.method === 'POST') {
    const raw = (await readBody(req)).toString('utf8');
    await locked(() => saveDoc(
      url.searchParams.get('repo'),
      url.searchParams.get('path'),
      url.searchParams.get('prefix'),
      raw,
    ));
    send(res, 200, 'saved', 'text/plain');
    return;
  }

  if (pathname === '/document/delete' && req.method === 'DELETE') {
    await readBody(req);
    await locked(() => {
      deleteDoc(url.searchParams.get('repo'), url.searchParams.get('path'));
    });
    send(res, 204, '');
    return;
  }

  if (pathname === '/sparql' && (req.method === 'GET' || req.method === 'POST')) {
    let query = url.searchParams.get('query');
    if (req.method === 'POST') {
      const raw = (await readBody(req)).toString('utf8');
      query = querystring.parse(raw).query || raw;
    }
    const result = await locked(() => runSparql(query, req.headers.accept));
    send(res, 200, result.body, result.type);
    return;
  }

  if (pathname === '/shacl/validate' && req.method === 'POST') {
    const fields = parseMultipart(await readBody(req), req.headers['content-type']);
    send(res, 200, await validateShacl(fields.graph, fields.shacl), 'application/ld+json');
    return;
  }

  if (pathname === '/api/search' && req.method === 'GET') {
    const body = await locked(() => search(url.searchParams.get('query')));
    send(res, 200, body, 'application/json');
    return;
  }

  if (pathname.startsWith('/api/index/')) {
    await readBody(req);
    send(res, 200, {}, 'application/json');
    return;
  }

  send(res, 404, 'not found', 'text/plain');
}

function startEmbeddedStore() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      handle(req, res).catch((err) => {
        if (!res.headersSent) send(res, 500, err.message || String(err), 'text/plain');
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { startEmbeddedStore };
