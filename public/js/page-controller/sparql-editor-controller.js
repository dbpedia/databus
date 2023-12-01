var DatabusWebappUtils = require("../utils/databus-webapp-utils");
const SparqlExamples = require("../utils/sparql-examples");

// Controller for the header section
function SparqlEditorController($scope, $http) {


  $scope.storageKey = `${DATABUS_RESOURCE_BASE_URL}/sparql`;

  $scope.auth = data.auth;
  $scope.authenticated = data.auth.authenticated;
  $scope.utils = new DatabusWebappUtils($scope);


  $scope.editor = {};


  $scope.editor.exampleQueries = {};
  $scope.editor.exampleQueries.label = "Databus Example Queries";
  $scope.editor.exampleQueries.children = [];

  var simpleQueries = {
    label: "Simple Queries",
    children : []
  };


  var intermediateQueries = {
    label: "Intermediate Queries",
    children : []
  };


  simpleQueries.children.push({
    label: "Select all Databus Groups",
    query: `PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX sec: <https://w3id.org/security#>
PREFIX cert: <http://www.w3.org/ns/auth/cert#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX databus-cv: <https://dataid.dbpedia.org/databus-cv#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT DISTINCT * WHERE {
  ?s a databus:Group .
}`
  });

  simpleQueries.children.push({
    label: "Select all Databus Artifacts",
    query: `PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX sec: <https://w3id.org/security#>
PREFIX cert: <http://www.w3.org/ns/auth/cert#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX databus-cv: <https://dataid.dbpedia.org/databus-cv#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT DISTINCT * WHERE {
  ?s a databus:Artifact .
}`
  });

  simpleQueries.children.push({
    label: "Select all Databus Versions",
    query: `PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX sec: <https://w3id.org/security#>
PREFIX cert: <http://www.w3.org/ns/auth/cert#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX databus-cv: <https://dataid.dbpedia.org/databus-cv#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT DISTINCT * WHERE {
  ?s a databus:Version .
}`
  });

  intermediateQueries.children.push({
    label: "Latest Version of Artifact",
    query: `PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX sec: <https://w3id.org/security#>
PREFIX cert: <http://www.w3.org/ns/auth/cert#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX databus-cv: <https://dataid.dbpedia.org/databus-cv#>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT ?version WHERE
{
  GRAPH ?g
  {
    ?version databus:artifact <INSERT_ARTIFACT_URI_HERE> .
    ?version dct:hasVersion ?v . 
  }
} 
ORDER BY DESC (STR(?v)) LIMIT 1`
  });


  $scope.editor.exampleQueries.children.push(simpleQueries);
  $scope.editor.exampleQueries.children.push(intermediateQueries);

  $scope.onExampleQueryClicked = function(node) {

    if(node.query == null) {
      return;
    }

    $scope.createQueryPage();

    var queryPage = $scope.queryData.pages[$scope.queryData.activeTab];

    queryPage.query = node.query;
    $scope.saveToStorage();
  }

  $scope.goToTab = function (index) {
    $scope.queryData.activeTab = index;
    $scope.saveToStorage();

    var queryPage = $scope.queryData.pages[$scope.queryData.activeTab];

    if ($scope.resultCache != null && $scope.resultCache[queryPage.name] != null) {
      $scope.editor.result = $scope.resultCache[queryPage.name];
    } else {
      $scope.editor.result = null;
    }
  }

  $scope.saveToStorage = function () {
    localStorage.setItem($scope.storageKey, JSON.stringify($scope.queryData));
  }

  $scope.deleteQueryPage = function ($index) {

    // Delete result cache entry
    var queryPage = $scope.queryData.pages[$scope.queryData.activeTab];
    if ($scope.resultCache != null && $scope.resultCache[queryPage.name] != null) {
      delete $scope.resultCache[queryPage.name];
      $scope.saveResultCache();
    }

    $scope.queryData.pages.splice($index, 1);

    if ($scope.queryData.pages.length == 0) {
      $scope.initialize();
    }
    else {
      var validTab = Math.min($scope.queryData.activeTab, $scope.queryData.pages.length - 1);

      if (validTab != $scope.queryData.activeTab) {
        $scope.goToTab(validTab);
      }
    }
  }

  $scope.createQueryPage = function () {

    var queryName = null;
    var queryNameIndex = 1;

    // find unoccupied name
    while (queryNameIndex < 100000) {

      // Create a candidate
      var hasName = true;
      queryName = `Query ${queryNameIndex}`;

      // Check if already in use
      for (var queryPage of $scope.queryData.pages) {
        if (queryPage.name == queryName) {
          hasName = false;
        }
      }

      // Found name, stop searching.
      if (hasName) {
        break;
      }

      queryNameIndex++;
    }

    $scope.queryData.pages.push({
      name: queryName,
      query: simpleQueries.children[0].query,
      endpoint: defaultEndpoint
    });

    $scope.goToTab($scope.queryData.pages.length - 1);

    $scope.saveToStorage();
  }

  $scope.saveResultCache = function () {
    sessionStorage.setItem($scope.storageKey, JSON.stringify($scope.resultCache));
  }

  $scope.initialize = function () {
    $scope.queryData = {};
    $scope.queryData.activeTab = 0;
    $scope.queryData.pages = [];
    $scope.createQueryPage();

    $scope.resultCache = {};
    $scope.saveResultCache();
  }

  var defaultEndpoint = `${DATABUS_RESOURCE_BASE_URL}/sparql`;

  var queryDataString = localStorage.getItem($scope.storageKey);
  var resultCacheString = sessionStorage.getItem($scope.storageKey);


  $scope.queryData = null;
  $scope.resultCache = JSON.parse(resultCacheString);

  try {
    $scope.queryData = JSON.parse(queryDataString);

    if ($scope.queryData == null || $scope.queryData.pages.length == 0) {
      $scope.initialize();
    }

    var queryPage = $scope.queryData.pages[$scope.queryData.activeTab];

    if ($scope.resultCache != null && $scope.resultCache[queryPage.name] != null) {
      $scope.editor.result = $scope.resultCache[queryPage.name];
    } else {
      $scope.editor.result = null;
    }

  }
  catch (e) {
    // Could not parse query data, create new!
    $scope.initialize();
  }

  $scope.editor.query = $scope.editor.exampleQueries[0];

  $scope.send = async function () {

    var queryPage = $scope.queryData.pages[$scope.queryData.activeTab];

    var res = await $http.post(queryPage.endpoint, { query: queryPage.query });

    if ($scope.resultCache == null) {
      $scope.resultCache = {};
    }

    $scope.resultCache[queryPage.name] = res.data;
    $scope.saveResultCache();

    $scope.editor.result = res.data;
    $scope.$apply();
  }

  $scope.insertExampleQuery = function (query) {
    $scope.editor.query = query;
  }

}

module.exports = SparqlEditorController;
