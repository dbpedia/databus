// hinzufügen eines Controllers zum Modul
function CollectionController($scope, $sce,  $http, collectionManager) {

  $scope.collection = new DatabusCollectionWrapper(data.collection);
  $scope.authenticated = data.auth.authenticated;
  $scope.activeTab = 0;

  $scope.collectionViewModel = {};
  $scope.collectionViewModel.downloadScript = [];
  $scope.collectionViewModel.downloadScript.length = 3;
  $scope.collectionViewModel.downloadScript[0] = 'query=$(curl -H "Accept:text/sparql" ' + $scope.collection.uri + ')';
  $scope.collectionViewModel.downloadScript[1] = 'files=$(curl -H "Accept: text/csv" --data-urlencode "query=${query}" https://databus.dbpedia.org/repo/sparql | tail -n+2 | sed \'s/"//g\')';
  $scope.collectionViewModel.downloadScript[2] = 'while IFS= read -r file ; do wget $file; done <<< "$files"';
  
  $scope.collectionViewModel.downloadManual = 'To fetch the query via *curl* run \n``` shell\n' 
  + $scope.collectionViewModel.downloadScript[0] + '\n```'
  + '\n\n\nTo download the files additionally run\n``` shell\n'
  + $scope.collectionViewModel.downloadScript[1] + '\n'
  + $scope.collectionViewModel.downloadScript[2] 
  + '\n```';

  $scope.collectionQuery = $scope.collection.createQuery();
  $scope.collectionManager = collectionManager;
  $scope.collectionFiles = "";


  $http.get('/system/collections/collection-statistics', { params : { uri : $scope.collection.uri } }).then(function(result) {
    for(let i in result.data.files) {
      $scope.collectionFiles += result.data.files[i].downloadURLs + "\n";
    }

    $scope.collection.statistics = result.data;
    $scope.files = result.data.files;
  });

  if($scope.authenticated) {
    $scope.username = data.auth.info.username;
  }

  $scope.formatUploadSize = function(size) {
    return DatabusUtils.formatFileSize(size);
  };

  $scope.markdownToHtml = function(markdown) {
    var converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };

  $scope.editCopy = function() {
    if(!$scope.collectionManager.isInitialized) {
      return;
    }

    let localCopy = $scope.collectionManager.createCopy($scope.collection);

    $scope.collectionManager.setActive(localCopy.uuid);
    window.location.href = '/system/collection-editor'
  }

  $scope.createSnapshot = function() {
    if(!$scope.collectionManager.isInitialized) {
      return;
    }

  
    let collectionSnapshot = $scope.collectionManager.createSnapshot($scope.collection);

    console.log(collectionSnapshot);
    $scope.collectionManager.setActive(collectionSnapshot.uuid);
    window.location.href = '/system/collection-editor'
  }

  $scope.editCollection = function() {

    if(!$scope.collectionManager.isInitialized) {
      return;
    }

    let localCopy = $scope.collectionManager.getCollectionByUri($scope.collection.uri);

    /// TODO Fabian - das sollte nicht passieren!
    if(localCopy === null) {
      console.log("editCollection failed due there is no collection with that uri: " + $scope.collection.uri )
      $scope.editCopy();
      return;
    }

    $scope.collectionManager.setActive(localCopy.uuid);
    window.location.href = '/system/collection-editor'
  }

  $scope.downloadAsJson = function() {
    DatabusCollectionUtils.exportToJsonFile($scope.collection);
  }

  $scope.queryToClipboard = function() {
    DatabusCollectionUtils.copyStringToClipboard($scope.collectionQuery);
    $scope.statusCode = DatabusResponse.COLLECTION_QUERY_COPIED_TO_CLIPBOARD;
  }

  $scope.openInYasgui = function() {
    window.location.href = 'https://databus.dbpedia.org/yasgui?query=' + encodeURIComponent($scope.collectionQuery); 
  }

  $scope.bashScriptToClipboard = function() {
    DatabusCollectionUtils.copyStringToClipboard($scope.collectionViewModel.downloadScript[0] + '\n'
      + $scope.collectionViewModel.downloadScript[1] + '\n' + $scope.collectionViewModel.downloadScript[2]);
    $scope.statusCode = DatabusResponse.COLLECTION_BASH_COPIED_TO_CLIPBOARD;
  }

  $scope.markdownToHtml = function(markdown) {
    let converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };

  $scope.filesToClipboard = function() {
    DatabusCollectionUtils.copyStringToClipboard($scope.collectionFiles);
    $scope.statusCode = DatabusResponse.COLLECTION_DOWNLOAD_URLS_COPIED_TO_CLIPBOARD;
  }

  $scope.getStatusMessage = function(code) {
    return DatabusResponse.Message[code];    
  }

  $scope.getStatusSuccess = function() {
    return $scope.statusCode >= 2000 && $scope.statusCode < 3000;   
  }

  $scope.resetStatus = function() {
    $scope.statusCode = 0;
  }

}
