const { setTimeout: sleep } = require('timers/promises');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const TestHarness = require('./tests/utils/test-harness');
const { preflightServices } = require('./tests/utils/preflight');

let server;
let serverOutput = '';

function testEnv() {
  TestHarness.loadEnv();
  TestHarness.applyLocalDefaults();
  return { ...process.env };
}

function waitForServerReady(timeoutMs = 120000) {
  const baseUrl = process.env.DATABUS_RESOURCE_BASE_URL;
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const readyPattern = /Databus is running!/;

    (async function poll() {
      if (readyPattern.test(serverOutput)) {
        try {
          await new Promise((res, rej) => {
            const req = http.get(`${baseUrl}/res/context.jsonld`, (r) => {
              if (r.statusCode === 200) res();
              else rej(new Error(`Unexpected status ${r.statusCode}`));
            });
            req.on('error', rej);
          });
          resolve();
          return;
        } catch (_) {
        }
      }

      if (Date.now() >= deadline) {
        reject(new Error('Server not responding in time'));
        return;
      }

      await sleep(200);
      poll();
    })();
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

async function runUvu() {
  return new Promise((resolve, reject) => {
    const uvuProcess = spawn('npx', ['uvu', './app/tests/'], {
      stdio: 'inherit',
      shell: true,
      env: testEnv(),
    });

    uvuProcess.on('error', (err) => reject(err));
    uvuProcess.on('close', (code) => resolve(code));
  });
}

async function run() {
  Object.assign(process.env, testEnv());

  try {
    await preflightServices();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  serverOutput = '';
  server = spawn('node', ['--trace-warnings', 'www'], {
    cwd: path.join(__dirname, '..'),
    env: testEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
    process.stdout.write(data);
  });
  server.stderr.on('data', (data) => {
    serverOutput += data.toString();
    process.stderr.write(data);
  });

  const serverExit = new Promise((_, reject) => {
    server.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  try {
    await Promise.race([waitForServerReady(), serverExit]);
    const code = await runUvu();
    process.exitCode = code || 0;
  } catch (err) {
    if (serverOutput.trim()) {
      console.error('\n--- server output ---\n' + serverOutput);
    }
    console.error(err);
    process.exit(1);
  } finally {
    if (server) server.kill();
  }
}

run();
