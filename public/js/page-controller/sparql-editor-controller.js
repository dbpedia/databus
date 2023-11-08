var DatabusWebappUtils = require("../utils/databus-webapp-utils");
const SparqlExamples = require("../utils/sparql-examples");

// Controller for the header section
function SparqlEditorController($scope, $http) {

  $scope.auth = data.auth;
  $scope.authenticated = data.auth.authenticated;
  $scope.utils = new DatabusWebappUtils($scope);


  $scope.editor = {};

  $scope.editor.exampleQueries = [
    `PREFIX databus: <https://dataid.dbpedia.org/databus#>
SELECT DISTINCT * WHERE {
  ?s a databus:Group .
}`, `PREFIX databus: <https://dataid.dbpedia.org/databus#>
SELECT DISTINCT * WHERE {
  ?s a databus:Artifact .
}`, `PREFIX databus: <https://dataid.dbpedia.org/databus#>
SELECT DISTINCT * WHERE {
  ?s a databus:Version .
}`
  ];

  $scope.goToTab = function (index) {
    $scope.queryData.activeTab = index;
    $scope.saveToStorage();
  }

  $scope.saveToStorage = function () {
    localStorage.setItem(storageKey, JSON.stringify($scope.queryData));
  }

  $scope.deleteQueryPage = function ($index) {
    $scope.queryData.pages.splice($index, 1);

    if ($scope.queryData.pages.length == 0) {
      $scope.initialize();
    }
    else {
      $scope.queryData.activeTab = Math.min($scope.queryData.activeTab, $scope.queryData.pages.length - 1);
      $scope.saveToStorage();
    }
  }

  $scope.createQueryPage = function () {

    var queryName = null;
    var queryNameIndex = 1;

    // find unoccupied name
    while(queryNameIndex < 100000) {

      // Create a candidate
      var hasName = true;
      queryName = `Query ${queryNameIndex}`;

      // Check if already in use
      for(var queryPage of $scope.queryData.pages)  {
        if(queryPage.name == queryName) {
          hasName = false;
        }
      }

      // Found name, stop searching.
      if(hasName) {
        break;
      }

      queryNameIndex++;
    }

    $scope.queryData.pages.push({
      name: queryName,
      query: $scope.editor.exampleQueries[0],
      endpoint: defaultEndpoint
    });

    $scope.saveToStorage();
  }

  $scope.initialize = function () {
    $scope.queryData = {};
    $scope.queryData.activeTab = 0;
    $scope.queryData.pages = [];
    $scope.createQueryPage();
  }

  var defaultEndpoint = `${DATABUS_RESOURCE_BASE_URL}/sparql`;

  var storageKey = `${DATABUS_RESOURCE_BASE_URL}/sparql`;
  var queryDataString = localStorage.getItem(storageKey);

  $scope.queryData = null;

  try {
    $scope.queryData = JSON.parse(queryDataString);

    if ($scope.queryData == null || $scope.queryData.pages.length == 0) {
      $scope.initialize();
    }
  }
  catch (e) {
    // Could not parse query data, create new!
    $scope.initialize();
  }

  $scope.editor.query = $scope.editor.exampleQueries[0];

  $scope.send = async function () {

    var res = await $http.post('/sparql', { query: $scope.editor.query });

    $scope.editor.result = res.data;
    $scope.$apply();
  }

  $scope.insertExampleQuery = function (query) {
    $scope.editor.query = query;
  }

}

module.exports = SparqlEditorController;
