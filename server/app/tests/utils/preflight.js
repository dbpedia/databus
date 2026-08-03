const waitForService = require('../../common/utils/wait-for-service');
const { waitForLookup } = require('../../common/utils/wait-for-service');

const DOCKER_HINT = 'Start backing services: docker compose up -d gstore virtuoso lookup  (or: cd devenv && make env-start)';

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable ${name}. ${DOCKER_HINT}`);
  }
}

async function preflightServices() {
  requireEnv('DATABUS_RESOURCE_BASE_URL');
  requireEnv('DATABUS_DATABASE_URL');
  requireEnv('LOOKUP_BASE_URL');

  if (!await waitForService(process.env.DATABUS_DATABASE_URL, 30, 1000)) {
    throw new Error(`gstore not reachable at ${process.env.DATABUS_DATABASE_URL}. ${DOCKER_HINT}`);
  }

  if (!await waitForLookup(process.env.LOOKUP_BASE_URL, 30, 1000)) {
    throw new Error(`lookup not reachable at ${process.env.LOOKUP_BASE_URL}. ${DOCKER_HINT}`);
  }
}

module.exports = { preflightServices, DOCKER_HINT };
