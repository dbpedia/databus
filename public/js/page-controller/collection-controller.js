const DatabusCollectionUtils = require("../collections/databus-collection-utils");
const DatabusCollectionWrapper = require("../collections/databus-collection-wrapper");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");

function CollectionController($scope, $sce, $http, collectionManager) {

  $scope.collection = new DatabusCollectionWrapper(data.collection);
  $scope.authenticated = data.auth.authenticated;
  $scope.activeTab = 0;
  $scope.collectionManager = collectionManager;

  // Make some util functions available in the template
  $scope.utils = new DatabusWebappUtils($scope, $sce);

  $scope.isOwn = false;

  if ($scope.authenticated) {

    $scope.collectionAccountName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.collection.uri, 2));
    $scope.accountName = data.auth.info.accountName;

    $scope.isOwn = $scope.accountName === $scope.collectionAccountName;
  }

  $scope.editCollection = function () {
    $scope.collectionManager.setActive($scope.collection.uuid);
    window.location = `/app/collection-editor`;
  }

  $scope.collectionViewModel = {};
  $scope.collectionViewModel.downloadScript = [];
  $scope.collectionViewModel.downloadScript.length = 3;
  $scope.collectionViewModel.downloadScript[0] = `query=$(curl -H "Accept:text/sparql" ${$scope.collection.uri})`;
  $scope.collectionViewModel.downloadScript[1] = `files=$(curl -X POST -H "Accept: text/csv" --data-urlencode "query=\${query}" ${DATABUS_RESOURCE_BASE_URL}/sparql | tail -n +2 | sed 's/\\r$//' | sed 's/"//g')`;
  $scope.collectionViewModel.downloadScript[2] = `while IFS= read -r file ; do wget $file; done <<< "$files"`;

  $scope.collectionViewModel.downloadManual = 'To fetch the query via *curl* run \n``` shell\n'
    + $scope.collectionViewModel.downloadScript[0] + '\n```'
    + '\n\n\nTo download the files additionally run\n``` shell\n'
    + $scope.collectionViewModel.downloadScript[1] + '\n'
    + $scope.collectionViewModel.downloadScript[2]
    + '\n```';

  $scope.collectionQuery = $scope.collection.createQuery();
  $scope.collectionManager = collectionManager;
  $scope.collectionFiles = "";


  DatabusCollectionUtils.getCollectionFileURLs($http, $scope.collection).then(function (result) {
    $scope.collectionFiles = result;
    $scope.$apply();
  }, function (err) {
    console.log(err);
  });


  if ($scope.authenticated) {
    $scope.username = data.auth.info.username;
  }

  $scope.formatUploadSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };



  $scope.editCopy = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    let localCopy = $scope.collectionManager.createCopy($scope.collection);

    $scope.collectionManager.setActive(localCopy.uuid);
    window.location.href = '/app/collection-editor'
  }

  $scope.createSnapshot = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }


    let collectionSnapshot = $scope.collectionManager.createSnapshot($scope.collection);

    $scope.collectionManager.setActive(collectionSnapshot.uuid);
    window.location.href = '/app/collection-editor'
  }

  $scope.editCollection = function () {

    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    let localCopy = $scope.collectionManager.getCollectionByUri($scope.collection.uri);

    /// TODO Fabian - das sollte nicht passieren!
    if (localCopy === null) {
      console.log("editCollection failed due there is no collection with that uri: " + $scope.collection.uri)
      $scope.editCopy();
      return;
    }

    $scope.collectionManager.setActive(localCopy.uuid);
    window.location.href = '/app/collection-editor'
  }

  $scope.downloadAsJson = function () {
    DatabusCollectionUtils.exportToJsonFile($scope.collection);
  }

  $scope.queryToClipboard = function () {

    $scope.utils.copyToClipboard($scope.collectionQuery);
    DatabusAlert.alert($scope, true, DatabusMessages.GENERIC_COPIED_TO_CLIPBOARD);

  }

  $scope.openInYasgui = function () {
    window.location.href = 'https://databus.dbpedia.org/yasgui?query=' + encodeURIComponent($scope.collectionQuery);
  }

  $scope.bashScriptToClipboard = function () {

    var bashscript = `${$scope.collectionViewModel.downloadScript[0]}
${$scope.collectionViewModel.downloadScript[1]}
${$scope.collectionViewModel.downloadScript[2]}`

    $scope.utils.copyToClipboard(bashscript);
    DatabusAlert.alert($scope, true, DatabusMessages.GENERIC_COPIED_TO_CLIPBOARD);
  }


  $scope.filesToClipboard = function () {
    $scope.utils.copyToClipboard($scope.collectionFiles);
    DatabusAlert.alert($scope, true, DatabusMessages.GENERIC_COPIED_TO_CLIPBOARD);
  }

}

module.exports = CollectionController;
