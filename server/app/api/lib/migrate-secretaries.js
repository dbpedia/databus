// ponytail: one-shot rewrite of account-level secretary triples onto the Person. Delete after deploy.
const jsonld = require('jsonld');
const DatabusUris = require('../../../../public/js/utils/databus-uris');
const DatabusConstants = require('../../../../public/js/utils/databus-constants');

function toPersonWebId(uri) {
  if (uri == null) return uri;
  const trimmed = String(uri).replace(/\/+$/, '');
  return trimmed.endsWith(DatabusConstants.WEBID_THIS) ? trimmed : `${trimmed}${DatabusConstants.WEBID_THIS}`;
}

function migrateExpanded(nodes) {
  let changed = false;

  for (const node of nodes) {
    const types = [].concat(node['@type'] || []);
    if (!types.includes(DatabusUris.DATABUS_ACCOUNT)) continue;
    const secretaries = node[DatabusUris.DATABUS_SECRETARY_PROPERTY];
    if (secretaries == null) continue;
    const person = nodes.find(candidate => candidate['@id'] === toPersonWebId(node['@id']));
    if (person == null) continue;
    const existing = person[DatabusUris.DATABUS_SECRETARY_PROPERTY] || [];
    person[DatabusUris.DATABUS_SECRETARY_PROPERTY] = existing.concat(secretaries);
    delete node[DatabusUris.DATABUS_SECRETARY_PROPERTY];
    changed = true;
  }

  for (const node of nodes) {
    const types = [].concat(node['@type'] || []);
    if (!types.includes(DatabusUris.DATABUS_SECRETARY)) continue;
    const accountRef = node[DatabusUris.DATABUS_ACCOUNT_PROPERTY];
    if (accountRef == null) continue;
    const id = accountRef[0] && (accountRef[0]['@id'] || accountRef[0]);
    node[DatabusUris.DATABUS_AGENT] = [{ '@id': toPersonWebId(id) }];
    delete node[DatabusUris.DATABUS_ACCOUNT_PROPERTY];
    changed = true;
  }

  return changed;
}

async function migrateAccount(accountName) {
  const GstoreResource = require('./gstore-resource');
  const defaultContext = require('../../common/res/context.jsonld');
  const uri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${accountName}`;
  const resource = new GstoreResource(uri);
  const doc = await resource.read();
  if (doc == null) return false;

  const flat = await jsonld.flatten(await jsonld.expand(doc));
  const nodes = Array.isArray(flat) ? flat : (flat['@graph'] || []);
  if (!migrateExpanded(nodes)) return false;

  resource.content = await jsonld.compact(nodes, defaultContext);
  await resource.save();
  return true;
}

async function migrateAll() {
  const DatabusUserDatabase = require('../../../userdb');
  const db = new DatabusUserDatabase();
  await db.connect();
  for (const account of await db.getAllAccounts()) {
    if (await migrateAccount(account.accountName)) {
      console.log(`migrated ${account.accountName}`);
    }
  }
}

function selfCheck() {
  const account = 'https://databus.example.org/mike';
  const nodes = [
    {
      '@id': account,
      '@type': [DatabusUris.DATABUS_ACCOUNT],
      [DatabusUris.DATABUS_SECRETARY_PROPERTY]: [{ '@id': '_:s' }],
    },
    {
      '@id': `${account}#this`,
      '@type': [DatabusUris.FOAF_PERSON],
    },
    {
      '@id': '_:s',
      '@type': [DatabusUris.DATABUS_SECRETARY],
      [DatabusUris.DATABUS_ACCOUNT_PROPERTY]: [{ '@id': 'https://databus.example.org/alex' }],
    },
  ];
  console.assert(migrateExpanded(nodes) === true);
  console.assert(nodes[0][DatabusUris.DATABUS_SECRETARY_PROPERTY] == null);
  console.assert(nodes[1][DatabusUris.DATABUS_SECRETARY_PROPERTY][0]['@id'] === '_:s');
  console.assert(nodes[2][DatabusUris.DATABUS_AGENT][0]['@id'] === 'https://databus.example.org/alex#this');
  console.assert(nodes[2][DatabusUris.DATABUS_ACCOUNT_PROPERTY] == null);
  console.assert(migrateExpanded(nodes) === false);
}

selfCheck();

if (require.main === module) {
  migrateAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrateExpanded, migrateAccount };
