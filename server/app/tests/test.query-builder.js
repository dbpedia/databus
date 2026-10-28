const { suite } = require('uvu');
const assert = require('uvu/assert');
const QueryBuilder = require('../../../public/js/query-builder/query-builder');
const QueryNode = require('../../../public/js/query-builder/query-node');
const QueryTemplates = require('../../../public/js/query-builder/query-templates');

const test = suite('query-builder');

const BASE = 'https://databus.example.org';
const GROUP = `${BASE}/user/group`;
const VERSION = 'http://purl.org/dc/terms/hasVersion';

function build(node) {
  return QueryBuilder.build({ node, template: QueryTemplates.DEFAULT_FILE_TEMPLATE, resourceBaseUrl: BASE });
}

function count(text, part) {
  return text.split(part).length - 1;
}

test('plain artifacts share one latest version sub-select', () => {
  const group = new QueryNode(GROUP, 'databus:group');
  group.setFacet(VERSION, '$latest', true);
  for (const name of ['a', 'b', 'c']) group.addChild(new QueryNode(`${GROUP}/${name}`, 'databus:artifact'));

  const pinned = new QueryNode(`${GROUP}/pinned`, 'databus:artifact');
  pinned.facetSettings[VERSION] = [{ value: '$latest', checked: false }, { value: '1.0', checked: true }];
  group.addChild(pinned);

  const query = build(group);
  assert.is(count(query, 'GROUP BY ?latestNode'), 1);
  assert.ok(query.includes(`VALUES ?latestNode0 { <${GROUP}/a> <${GROUP}/b> <${GROUP}/c> }`));
  assert.not.ok(query.includes('VALUES ?node'));
  assert.ok(query.includes(`?dataset databus:artifact <${GROUP}/pinned> .`));
  assert.ok(query.includes(`{ ?distribution <${VERSION}> '1.0' . }`));
  assert.not.ok(JSON.stringify(group).includes('hasLatestRestriction'));
});

test('plain artifacts without latest version are restricted by VALUES', () => {
  const group = new QueryNode(GROUP, 'databus:group');
  for (const name of ['a', 'b']) group.addChild(new QueryNode(`${GROUP}/${name}`, 'databus:artifact'));

  const query = build(group);
  assert.ok(query.includes(`VALUES ?node0 { <${GROUP}/a> <${GROUP}/b> }`));
  assert.not.ok(query.includes('?latestNode'));
});

test.run();
