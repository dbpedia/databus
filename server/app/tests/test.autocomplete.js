const { suite } = require('uvu');
const assert = require('uvu/assert');
const ServerUtils = require('../common/utils/server-utils');
const DatabusUris = require('../../../public/js/utils/databus-uris');
const autocompleter = require('../api/lib/dataid-autocomplete');

const test = suite('dataid-autocomplete');

test.before(() => {
  ServerUtils.setupRequireExtensions();
});

test('autofillFileIdentifiers encodes special characters in content variant values', () => {
  // Create a mock version graph with content variants that have special characters
  const datasetUri = 'https://databus.dev.dbpedia.link/jj-test/ex-group/exotic-filenames/2025-10-16';
  
  const expandedGraph = [
    {
      '@id': datasetUri,
      '@type': [DatabusUris.DATABUS_VERSION],
      'http://purl.org/dc/terms/title': [{ '@value': 'Test Version' }],
      'http://purl.org/dc/terms/description': [{ '@value': 'Test description' }],
      'http://purl.org/dc/terms/license': [{ '@id': 'http://foo.lic' }],
      'http://purl.org/dc/terms/distribution': []
    },
    {
      '@type': [DatabusUris.DATABUS_PART],
      [DatabusUris.DATABUS_FORMAT_EXTENSION]: [{ '@value': 'none' }],
      [DatabusUris.DATABUS_COMPRESSION]: [{ '@value': 'none' }],
      'http://www.w3.org/ns/dcat#downloadURL': [{ '@id': 'https://httpbin.org/anything?test=url-value' }],
      'https://dataid.dbpedia.org/databus-cv#test': [{ '@value': 'http://url.value/foo#bar' }]
    }
  ];

  // Run autocomplete
  autocompleter.autocomplete(expandedGraph);

  // Find the distribution graph
  const distributionGraphs = expandedGraph.filter(g => 
    g['@type'] && g['@type'].includes(DatabusUris.DATABUS_PART)
  );
  
  assert.is(distributionGraphs.length, 1, 'Should have one distribution');
  
  const distribution = distributionGraphs[0];
  const generatedId = distribution['@id'];
  
  // The generated ID should have encoded the special characters
  // Original value: http://url.value/foo#bar
  // Expected encoding: http%3A%2F%2Furl.value%2Ffoo%23bar
  assert.ok(generatedId, 'Distribution should have an @id');
  assert.ok(generatedId.includes('#'), 'ID should contain fragment separator');
  
  // Check that special characters are encoded
  const fragmentPart = generatedId.split('#')[1];
  assert.ok(fragmentPart.includes('%3A'), 'Fragment should encode colons');
  assert.ok(fragmentPart.includes('%2F'), 'Fragment should encode slashes');
  assert.ok(fragmentPart.includes('%23'), 'Fragment should encode hash symbols');
  
  // Check that the delimiter characters are not encoded
  assert.ok(fragmentPart.includes('_'), 'Fragment should contain underscore delimiter');
  assert.ok(fragmentPart.includes('='), 'Fragment should contain equals delimiter');
});

test('autofillFileIdentifiers encodes artifact name', () => {
  const datasetUri = 'https://databus.dev.dbpedia.link/test-account/test-group/my-artifact-name/2025-10-16';
  
  const expandedGraph = [
    {
      '@id': datasetUri,
      '@type': [DatabusUris.DATABUS_VERSION],
      'http://purl.org/dc/terms/title': [{ '@value': 'Test Version' }],
      'http://purl.org/dc/terms/description': [{ '@value': 'Test description' }],
      'http://purl.org/dc/terms/license': [{ '@id': 'http://foo.lic' }],
      'http://purl.org/dc/terms/distribution': []
    },
    {
      '@type': [DatabusUris.DATABUS_PART],
      [DatabusUris.DATABUS_FORMAT_EXTENSION]: [{ '@value': 'ttl' }],
      [DatabusUris.DATABUS_COMPRESSION]: [{ '@value': 'none' }],
      'http://www.w3.org/ns/dcat#downloadURL': [{ '@id': 'https://example.org/test.ttl' }]
    }
  ];

  // Run autocomplete
  autocompleter.autocomplete(expandedGraph);

  const distributionGraphs = expandedGraph.filter(g => 
    g['@type'] && g['@type'].includes(DatabusUris.DATABUS_PART)
  );
  
  const distribution = distributionGraphs[0];
  const generatedId = distribution['@id'];
  
  // Should contain the artifact name and format extension
  assert.ok(generatedId, 'Distribution should have an @id');
  assert.ok(generatedId.includes('#'), 'ID should contain fragment separator');
  
  const fragmentPart = generatedId.split('#')[1];
  // For normal artifact names without special chars, encoding shouldn't change much
  assert.ok(fragmentPart.includes('my-artifact-name'), 'Fragment should contain artifact name');
  assert.ok(fragmentPart.includes('.ttl'), 'Fragment should contain format extension');
});

test('autofillFileIdentifiers handles multiple content variants', () => {
  const datasetUri = 'https://databus.dev.dbpedia.link/test-account/test-group/test-artifact/2025-10-16';
  
  const expandedGraph = [
    {
      '@id': datasetUri,
      '@type': [DatabusUris.DATABUS_VERSION],
      'http://purl.org/dc/terms/title': [{ '@value': 'Test Version' }],
      'http://purl.org/dc/terms/description': [{ '@value': 'Test description' }],
      'http://purl.org/dc/terms/license': [{ '@id': 'http://foo.lic' }],
      'http://purl.org/dc/terms/distribution': []
    },
    {
      '@type': [DatabusUris.DATABUS_PART],
      [DatabusUris.DATABUS_FORMAT_EXTENSION]: [{ '@value': 'ttl' }],
      [DatabusUris.DATABUS_COMPRESSION]: [{ '@value': 'gz' }],
      'http://www.w3.org/ns/dcat#downloadURL': [{ '@id': 'https://example.org/test.ttl.gz' }],
      'https://dataid.dbpedia.org/databus-cv#lang': [{ '@value': 'en' }],
      'https://dataid.dbpedia.org/databus-cv#type': [{ '@value': 'special/type' }]
    }
  ];

  // Run autocomplete
  autocompleter.autocomplete(expandedGraph);

  const distributionGraphs = expandedGraph.filter(g => 
    g['@type'] && g['@type'].includes(DatabusUris.DATABUS_PART)
  );
  
  const distribution = distributionGraphs[0];
  const generatedId = distribution['@id'];
  
  assert.ok(generatedId, 'Distribution should have an @id');
  
  const fragmentPart = generatedId.split('#')[1];
  
  // Check that the slash in 'special/type' is encoded
  assert.ok(fragmentPart.includes('%2F'), 'Fragment should encode slashes in content variant values');
});

test.run();
