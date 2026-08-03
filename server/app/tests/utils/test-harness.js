const fs = require('fs');
const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
const rp = require('request-promise');
const assert = require('uvu/assert');
const DatabusUserDatabase = require('../../../userdb');
const DatabusUserTestUtils = require('./userdb-utils');
const ServerUtils = require('../../common/utils/server-utils');

const master_account = require('../templates/master-account.json');
const test_account = require('../templates/test-account.json');

const baseUrl = () => process.env.DATABUS_RESOURCE_BASE_URL;

class TestHarness {

  static loadEnv() {
    const envPath = path.join(__dirname, '../../../../.env');
    if (!fs.existsSync(envPath)) {
      return;
    }

    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const eq = trimmed.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  static applyLocalDefaults() {
    process.env.DATABUS_RESOURCE_BASE_URL = process.env.DATABUS_RESOURCE_BASE_URL || 'http://localhost:3000';
    process.env.DATABUS_DATABASE_URL = process.env.DATABUS_DATABASE_URL || 'http://localhost:3002';
    process.env.LOOKUP_BASE_URL = process.env.LOOKUP_BASE_URL || 'http://localhost:3004';
    process.env.DATABUS_NAME = process.env.DATABUS_NAME || 'Test Databus';
    process.env.DATABUS_ABSTRACT = process.env.DATABUS_ABSTRACT || 'Test instance';
    process.env.DATABUS_PRIVATE_MODE = process.env.DATABUS_PRIVATE_MODE || 'false';
    process.env.MAX_WORKERS = process.env.MAX_WORKERS || '1';
  }

  static contextUrl() {
    return `${baseUrl()}/res/context.jsonld`;
  }

  static templateVars(extra = {}) {
    return {
      DATABUS_RESOURCE_BASE_URL: baseUrl(),
      ACCOUNT: test_account.ACCOUNT_NAME,
      GROUP: test_account.GROUP_NAME,
      ARTIFACT: test_account.ARTIFACT_NAME,
      VERSION: test_account.VERSION_NAME,
      COLLECTION: test_account.COLLECTION_NAME,
      ...extra,
    };
  }

  static loadTemplate(filename) {
    return ServerUtils.formatJsonTemplate(require(`../templates/${filename}`), this.templateVars());
  }

  static async assertStatus(options, expectedCode) {
    const response = await rp({ simple: false, ...options });
    assert.is(response.statusCode, expectedCode);
    return response;
  }

  static async setupMaster(db) {
    await DatabusUserTestUtils.insertAccount(db, master_account);
  }

  static async deleteTestAccountIfExists() {
    await this.assertStatus({
      headers: { 'x-api-key': master_account.APIKEY },
      resolveWithFullResponse: true,
      uri: `${baseUrl()}/api/account/delete`,
      method: 'POST',
      json: true,
      simple: false,
      body: { accountName: test_account.ACCOUNT_NAME },
    }, 404);
  }

  static async deleteTestAccount() {
    await this.assertStatus({
      headers: { 'x-api-key': master_account.APIKEY },
      resolveWithFullResponse: true,
      uri: `${baseUrl()}/api/account/delete`,
      method: 'POST',
      json: true,
      simple: false,
      body: { accountName: test_account.ACCOUNT_NAME },
    }, 200);
  }

  static async createTestAccount() {
    const response = await rp({
      method: 'POST',
      uri: `${baseUrl()}/api/account/create`,
      headers: { 'x-api-key': master_account.APIKEY },
      json: true,
      resolveWithFullResponse: true,
      body: { name: test_account.ACCOUNT_NAME, label: 'Test Label' },
    });

    assert.is(response.statusCode, 200);
    return response;
  }

  static async setupTestAccount(db) {
    await this.createTestAccount();
    await DatabusUserTestUtils.insertApiKey(db, test_account);
  }

  static async connectDb() {
    ServerUtils.setupRequireExtensions();
    const db = new DatabusUserDatabase();
    await db.connect();
    return db;
  }

  static async standardBefore() {
    const db = await this.connectDb();
    await this.setupMaster(db);
    await this.deleteTestAccountIfExists();
    await this.setupTestAccount(db);
    return db;
  }

  static async standardAfter(db) {
    try {
      await this.deleteTestAccount();
    } catch (err) {
      await this.deleteTestAccountIfExists();
    }
    await DatabusUserTestUtils.deleteUser(db, master_account);
  }

  static async waitForSearchHit(query, expectedUri, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    const uri = `${baseUrl()}/api/search?query=${encodeURIComponent(query)}&typeName=Account`;

    while (Date.now() < deadline) {
      const response = await rp({
        method: 'GET',
        uri,
        headers: { 'x-api-key': master_account.APIKEY },
        json: true,
        resolveWithFullResponse: true,
      });

      const hit = response.body.docs?.find(doc => doc.id[0] === expectedUri);
      if (hit) {
        return hit;
      }

      await sleep(500);
    }

    assert.unreachable(`Search did not index ${expectedUri} within ${timeoutMs}ms`);
  }

  static registerOptions(body) {
    return {
      method: 'POST',
      uri: `${baseUrl()}/api/register`,
      headers: { 'x-api-key': test_account.APIKEY },
      json: true,
      resolveWithFullResponse: true,
      body,
    };
  }

  static putOptions(uri, body) {
    return {
      method: 'PUT',
      uri,
      headers: { 'x-api-key': test_account.APIKEY },
      json: true,
      resolveWithFullResponse: true,
      body,
    };
  }

  static getOptions(uri, accept = 'application/ld+json') {
    return {
      method: 'GET',
      uri,
      headers: { Accept: accept },
      resolveWithFullResponse: true,
      simple: false,
    };
  }

  static deleteOptions(uri) {
    return {
      method: 'DELETE',
      uri,
      headers: { 'x-api-key': test_account.APIKEY },
      resolveWithFullResponse: true,
      simple: false,
    };
  }

  static ownerAccountUri() {
    return `${baseUrl()}/${test_account.ACCOUNT_NAME}`;
  }

  static secretaryHeaders(onBehalfOf = this.ownerAccountUri()) {
    return {
      'x-api-key': master_account.APIKEY,
      'x-on-behalf-of': onBehalfOf,
    };
  }

  static onBehalfOfRegisterOptions(body, onBehalfOf = this.ownerAccountUri()) {
    return {
      method: 'POST',
      uri: `${baseUrl()}/api/register`,
      headers: this.secretaryHeaders(onBehalfOf),
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body,
    };
  }

  static onBehalfOfPutOptions(uri, body, onBehalfOf = this.ownerAccountUri()) {
    return {
      method: 'PUT',
      uri,
      headers: this.secretaryHeaders(onBehalfOf),
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body,
    };
  }

  static onBehalfOfDeleteOptions(uri, onBehalfOf = this.ownerAccountUri()) {
    return {
      method: 'DELETE',
      uri,
      headers: this.secretaryHeaders(onBehalfOf),
      resolveWithFullResponse: true,
      simple: false,
    };
  }

  static updateAccountOptions(body, apiKey = test_account.APIKEY) {
    return {
      method: 'POST',
      uri: `${baseUrl()}/api/account/update`,
      headers: { 'x-api-key': apiKey },
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body,
    };
  }

  static addSecretaryBody(writeAccessPaths = []) {
    const toAbsolute = (path) => path.startsWith('http')
      ? path
      : `${baseUrl()}/${test_account.ACCOUNT_NAME}/${path.replace(/^\/+/, '')}`;

    return {
      accountName: test_account.ACCOUNT_NAME,
      label: 'Test Label',
      status: 'active',
      secretaries: [{
        accountName: `${baseUrl()}/${master_account.ACCOUNT_NAME}`,
        hasWriteAccessTo: writeAccessPaths.map(toAbsolute),
      }],
    };
  }
}

module.exports = TestHarness;
