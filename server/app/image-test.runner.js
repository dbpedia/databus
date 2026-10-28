// Runs app/image-tests against a built Databus image: `npm run test:image` (or set DATABUS_IMAGE).
// On native Linux Docker the container can't reach host loopback: set SMOKE_STORE_HOST=0.0.0.0 there.
const { execFileSync, spawn, spawnSync } = require('child_process');
const net = require('net');
const { setTimeout: sleep } = require('timers/promises');
const { startEmbeddedStore } = require('./tests/utils/embedded-store');

const image = process.env.DATABUS_IMAGE || 'databus:smoke';
const container = `databus-smoke-${process.pid}`;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();

function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer().listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitReady(baseUrl, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (docker('inspect', '-f', '{{.State.Running}}', container) !== 'true') {
      throw new Error('container exited');
    }
    try {
      if ((await fetch(`${baseUrl}/res/context.jsonld`)).status === 200) return;
    } catch (_) {
    }
    await sleep(500);
  }
  throw new Error('container not ready in time');
}

async function run() {
  const store = await startEmbeddedStore(process.env.SMOKE_STORE_HOST);
  const port = await freePort();
  const storeUrl = `http://host.docker.internal:${store.port}`;
  const env = {
    PORT: String(port),
    DATABUS_RESOURCE_BASE_URL: `http://localhost:${port}`,
    DATABUS_DATABASE_URL: storeUrl,
    LOOKUP_BASE_URL: storeUrl,
    DATABUS_NAME: 'Smoke Test Databus',
    DATABUS_ABSTRACT: 'smoke',
    DATABUS_PRIVATE_MODE: 'false',
    MAX_WORKERS: '1',
    DATABUS_OIDC_ISSUER_BASE_URL: process.env.DATABUS_OIDC_ISSUER_BASE_URL || 'https://kilt.eu.auth0.com',
    DATABUS_OIDC_CLIENT_ID: 'smoke',
    DATABUS_OIDC_SECRET: 'smoke-test-placeholder-secret',
  };

  try {
    docker('run', '-d', '--name', container,
      '--add-host', 'host.docker.internal:host-gateway',
      '-p', `127.0.0.1:${port}:${port}`,
      ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
      image);

    await waitReady(env.DATABUS_RESOURCE_BASE_URL);

    process.exitCode = await new Promise((resolve, reject) => {
      spawn('npx', ['uvu', './app/image-tests/'], { stdio: 'inherit', shell: true, env: { ...process.env, ...env } })
        .on('error', reject)
        .on('close', resolve);
    });
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    if (process.exitCode) {
      console.error('\n--- container logs ---');
      spawnSync('docker', ['logs', container], { stdio: 'inherit' });
    }
    try { docker('rm', '-f', container); } catch (_) {}
    await store.close();
  }
}

run();
