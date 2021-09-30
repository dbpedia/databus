var shaclTester = require('../common/shacl/shacl-tester');
var signer = require('./databus-tractate-suite');
var databaseManager = require('../common/remote-database-manager');
var jsonld = require('jsonld');
var defaultContext = require('../../../context.json');
const sparql = require('../common/queries/sparql');
const UriUtils = require('../common/utils/uri-utils');
const ServerUtils = require('../common/utils/server-utils.js');
const request = require('request');

var constructor = require('../common/execute-construct.js');
var constructGroupQuery = require('../common/queries/constructs/construct-group.sparql');
var constructVersionQuery = require('../common/queries/constructs/construct-version.sparql');

const RDF_URIS = {
  DATASET: 'http://dataid.dbpedia.org/ns/core#Dataset',
  DB_TRACTATE_V1: 'https://databus.dbpedia.org/system/ontology#DatabusTractateV1',
  PROP_PUBLISHER: 'http://purl.org/dc/terms/publisher',
  PROOF: 'https://w3id.org/security#proof',
  TYPE: '@type',
  VERSION: 'http://dataid.dbpedia.org/ns/core#Version',
  ARTIFACT: 'http://dataid.dbpedia.org/ns/core#Artifact',
  GROUP: 'http://dataid.dbpedia.org/ns/core#Group',
  PROP_VERSION: 'http://dataid.dbpedia.org/ns/core#version',
  PROP_ARTIFACT: 'http://dataid.dbpedia.org/ns/core#artifact',
  PROP_GROUP: 'http://dataid.dbpedia.org/ns/core#group'
}

module.exports = function (router, protector) {

  function getTypedGraph(graphs, graphType) {
    for (var g in graphs) {
      var graph = graphs[g];

      if (graph['@type'] != undefined && graph['@type'].includes(graphType)) {
        return graph;
      }
    }

    return null;
  }

  function getGraphById(graphs, id) {
    for (var g in graphs) {
      var graph = graphs[g];

      if (graph['@id'] === id) {
        return graph;
      }
    }

    return null;
  }

  function getFirstObject(graph, key, expandedGraphs) {
    var obj = graph[key];

    if (obj == undefined || obj.length < 1) {
      return null;
    }

    var obj = obj[0];

    if (obj == undefined) {
      return null;
    }

    if (expandedGraphs != undefined && obj['@id'].startsWith('_:')) {
      obj = getGraphById(expandedGraphs, obj['@id']);
    }

    return obj;
  }

  function getFirstObjectUri(graph, key) {
    var obj = graph[key];

    if (obj == undefined || obj.length < 1) {
      return null;
    }

    return obj[0]['@id'];
  }

  router.get('/:account/:group/:artifact/:version', ServerUtils.JSON_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = req.path;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/file/read?repo=${repo}&path=${path}/dataid.jsonld`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
  });

  router.put('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {

    try {

      console.log('Upload request received at ' + req.originalUrl);
      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot publish data in a foreign namespace.\n');
        return;
      }

      var group = await sparql.dataid.getGroup(req.params.account, req.params.group);

      if (group == undefined) {
        res.status(400).send(`The specified group '${req.params.group}' does not exist\n`);
        return;
      }

      // Create the account uri
      var accountUri = `${process.env.DATABUS_RESOURCE_BASE_URL}/${req.databus.accountName}`;

      // Only work on expanded jsonld
      var expandedGraph = await jsonld.flatten(await jsonld.expand(req.body));

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateDataidRDF(expandedGraph);

      // Return failure with SHACL validation message
      if (!shaclResult.isSuccess) {
        var response = 'SHACL validation error:\n';
        for (var m in shaclResult.messages) {
          response += `>>> ${shaclResult.messages[m]}\n`
        }

        res.status(400).send(response);
        return;
      }

     
      // Validate all identifiers...
      var datasetGraph = getTypedGraph(expandedGraph, RDF_URIS.DATASET);
      var versionGraph = getTypedGraph(expandedGraph, RDF_URIS.VERSION);
      var artifactGraph = getTypedGraph(expandedGraph, RDF_URIS.ARTIFACT);

      var datasetUri = datasetGraph['@id'];
      var datasetPublisherUri = getFirstObjectUri(datasetGraph, RDF_URIS.PROP_PUBLISHER);
      var datasetGroupUri = getFirstObjectUri(datasetGraph, RDF_URIS.PROP_GROUP);
      var datasetArtifactUri = getFirstObjectUri(datasetGraph, RDF_URIS.PROP_ARTIFACT);
      var datasetVersionUri = getFirstObjectUri(datasetGraph, RDF_URIS.PROP_VERSION);


      // Validate Group URI
      var expectedPath = `/${req.params.account}/${req.params.group}`;
      if (!UriUtils.isResourceUri(datasetGroupUri, expectedPath)) {
        res.status(400).send(`The specified dataset group identifier does not match the request path. (Specified: ${datasetGroupUri}, expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }

      // Validate Artifact URIs
      expectedPath = `${expectedPath}/${req.params.artifact}`;
      if (!UriUtils.isResourceUri(datasetArtifactUri, expectedPath)) {
        res.status(400).send(`The specified dataset artifact identifier (dataid:Dataset) does not match the request path. (Specified: ${datasetArtifactUri}, expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }
      
      if (!UriUtils.isResourceUri(artifactGraph['@id'], expectedPath)) {
        res.status(400).send(`The specified dataset artifact identifier (dataid:Artifact) does not match the request path. (Expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }

      // Validate Version URIs
      expectedPath = `${expectedPath}/${req.params.version}`;
      if (!UriUtils.isResourceUri(datasetVersionUri, expectedPath)) {
        res.status(400).send(`The specified dataset version identifier (dataid:Dataset) does not match the request path. (Expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }
      if (!UriUtils.isResourceUri(versionGraph['@id'], expectedPath)) {
        res.status(400).send(`The specified version identifier (dataid:Version) does not match the request path. (Expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }

      // Validate DataId URI
      expectedPath = `${expectedPath}/dataid.jsonld#Dataset`;
      if (!UriUtils.isResourceUri(datasetUri, expectedPath)) {
        res.status(400).send(`The specified dataset identifier does not match the request path. (Specified: ${datasetUri}, expected: ${process.env.DATABUS_RESOURCE_BASE_URL}${expectedPath})\n`);
        return;
      }

      console.log(`Publisher found: ${datasetPublisherUri}...`);
      // Validate the publisher and account (<publisherUri> <foaf:account> <accountUri>)
      var isPublisherConnectedToAccount = await sparql.accounts.getPublisherHasAccount(datasetPublisherUri, accountUri);

      if (!isPublisherConnectedToAccount) {
        res.status(400).send('The specified publisher is not associated with the requested account');
        return;
      }

      // Check for proof
      var proofGraph = getFirstObject(datasetGraph, RDF_URIS.PROOF, expandedGraph);

      // Not setting the proof is allowed!
      if (proofGraph == undefined) {

        // No proof yet, try to create one
        console.log('No signature found...');

        // Verify if this account is an internal one
        if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
          res.status(400).send('Uploads using an external account need to provide a signature');
          return;
        }

        console.log('Internal account detected. Generating proof...');
        proofGraph = signer.createProof(expandedGraph);
        datasetGraph[RDF_URIS.PROOF] = [proofGraph];
      }

      // Get the type of the proof graph
      var proofType = getFirstObject(proofGraph, RDF_URIS.TYPE);

      // console.log(`Proof found: ${proofType}`);
      if (proofType != RDF_URIS.DB_TRACTATE_V1) {
        res.status(400).send(`Unkown proof type "${proofType}"\n`);
        return;
      }

      // Validate
      // console.log(`Validating provided proof`);
      var validationSuccess = await signer.validate(signer.canonicalize(expandedGraph), proofGraph);

      if (!validationSuccess) {
        res.status(400).send('The provided signature is invalid\n');
        return;
      }

      // Create compacted graph
      var compactedGraph = await jsonld.compact(expandedGraph, defaultContext);
      var targetPath = req.originalUrl.substring(1) + '/dataid.jsonld';

      // TODO: ask query
      var existingVersion = null;///await sparql.dataid.getVersion(req.params.account,
      //  req.params.group, req.params.artifact, req.params.version);

      console.log(JSON.stringify(compactedGraph, null, 3));
      // Save the RDF with the current path using the database manager
      var publishResult = await databaseManager.save(req.params.account, targetPath, compactedGraph);

      // Return failure
      if (!publishResult.isSuccess) {
        res.status(500).send('Internal database error\n');
        return;
      }

      // Return success
      if (existingVersion == null) {
        res.status(201).send('Version created successfully\n');
      } else {
        res.status(200).send('Version saved successfully\n');
      }

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }

  });

  router.get('/:account/:group', ServerUtils.JSON_ACCEPTED, async function (req, res, next) {

    var repo = req.params.account;
    var path = req.path;

    let options = {
      url: `${process.env.DATABUS_DATABASE_URL}/file/read?repo=${repo}&path=${path}/group.jsonld`,
      headers: {
        'Accept': 'application/ld+json'
      },
      json: true
    };

    request(options).pipe(res);
    return;
  });


  /**
   * Publishing of groups
   */
  router.put('/:account/:group', protector.protect(), async function (req, res, next) {

    try {

      if (req.params.account != req.databus.accountName) {
        res.status(403).send('You cannot edit groups in a foreign namespace.\n');
        return;
      }

      // Validate the group RDF with the shacl validation tool
      var shaclResult = await shaclTester.validateGroupRDF(req.body);

      // Return failure
      if (!shaclResult.isSuccess) {
        // todo
        var response = 'SHACL validation error:\n';
        for (var m in shaclResult.messages) {
          response += `>>> ${shaclResult.messages[m]}\n`
        }

        res.status(400).send(response);
        return;
      }

      var triples = await constructor.executeConstruct(req.body, constructGroupQuery);
      var expandedGraphs = await jsonld.flatten(await jsonld.fromRDF(triples));

      // TODO: Move this to SHACL if possible
      if (expandedGraphs.length > 1) {
        res.status(400).send(`You cannot specify multiple graphs. (${expandedGraphs.length} specified) \n`);
        return;
      }

      // Get the group graph (enforced by earlier SHACL test)
      var groupGraph = getTypedGraph(expandedGraphs, 'http://dataid.dbpedia.org/ns/core#Group');

      if (!UriUtils.isResourceUri(groupGraph['@id'], req.path)) {
        res.status(400).send('The specified group graph identifier does not match the request path.\n');
        return;
      }


      var targetPath = req.originalUrl.substring(1) + '/group.jsonld';

      var existingGroup = await sparql.dataid.getGroup(req.params.account, req.params.group);

      // Save the RDF with the current path using the database manager
      var publishResult = await databaseManager.save(req.params.account, targetPath, req.body);

      // Return failure
      if (!publishResult.isSuccess) {
        res.status(500).send('Internal database error.\n');
        return;
      }

      // Return success
      if (existingGroup == null) {
        res.status(201).send('Group created successfully.\n');
      } else {
        res.status(200).send('Group saved successfully.\n');
      }

    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

  router.delete('/:account/:group/:artifact/:version', protector.protect(), async function (req, res, next) {


  });

  router.delete('/:account/:group', protector.protect(), async function (req, res, next) {


  });

}