
/**
 * Controls the collection editor page
 * @param {*} $scope 
 * @param {*} $timeout 
 * @param {*} $http 
 * @param {*} $location 
 * @param {*} collectionManager 
 * @returns 
 */
function CollectionsEditorController($scope, $timeout, $http, $location, collectionManager) {

  $scope.authenticated = data.auth.authenticated;
  $scope.baseUrl = DATABUS_RESOURCE_BASE_URL;

  // Check for proper authentication
  if (!$scope.authenticated) {
    return;
  }

  $scope.accountName = data.auth.info.accountName;
  $scope.hasAccount = $scope.accountName != undefined;

  if (!$scope.hasAccount) {
    return;
  }

  // Create a tab navigation object for the tab navigation with locato
  $scope.tabNavigation = new TabNavigation($scope, $location, [
    'docu', 'content', 'preview', 'query', 'json', 'import'
  ]);

  // Make some util functions available in the template
  $scope.utils = new DatabusWebappUtils($scope);

  // Make the manager available in the template
  $scope.collectionManager = collectionManager;

  // Form data object for input errors and extra fields and toggles
  $scope.form = {};
  $scope.form.title = {};
  $scope.form.identifier = {};
  $scope.form.identifier.value = "";
  $scope.form.abstract = {};
  $scope.form.description = {};
  $scope.form.isHidden = $scope.collectionManager.activeCollection.issued == undefined;
  $scope.form.collectionPublishTag = '';
  var description = $scope.collectionManager.activeCollection.description;
  var generatedAbstract = DatabusUtils.createAbstractFromDescription(description);
  $scope.form.generateAbstract = $scope.collectionManager.activeCollection.abstract == generatedAbstract;

  /**
   * Triggered when the description field gets changed.
   * Generates an abstract from the description. 
   * @returns 
   */
  $scope.onDescriptionChanged = function () {
    if ($scope.form == null) {
      return;
    }

    if ($scope.form.generateAbstract) {
      var description = $scope.collectionManager.activeCollection.description;
      var generatedAbstract = DatabusUtils.createAbstractFromDescription(description);
      $scope.collectionManager.activeCollection.abstract = generatedAbstract;
    }

    // Triggers saving to the local storage
    $scope.onActiveCollectionChanged();
  }


  /**
   * Called whenever an input field or similar gets changed. Persists the local changes in the local storage
   */
  $scope.onActiveCollectionChanged = function () {

    let collection = $scope.collectionManager.activeCollection;

    // Save to storage
    if ($scope.collectionManager.isInitialized) {
      $scope.collectionManager.saveLocally();
    }

    // Refresh query and json representation
    $scope.collectionQuery = new DatabusCollectionWrapper(collection).createQuery();
    $scope.collectionJson = $scope.getCollectionJson();

    if (collection != null) {
      collection.hasLocalChanges = $scope.collectionManager.hasLocalChanges(collection);
    }

    DatabusCollectionUtils.checkCollectionForm($scope.form, collection)
  }

  $scope.getStatusMessage = function (code) {
    return DatabusResponse.Message[code];
  }

  $scope.getStatusSuccess = function () {
    return $scope.statusCode >= 2000 && $scope.statusCode < 3000;
  }

  $scope.resetStatus = function () {
    $scope.statusCode = 0;
  }

  $scope.preview = function () {
    if ($scope.collectionManager.activeCollection.isDraft) {
      return;
    }

    var identifier = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri);
    window.location.href = `/${$scope.accountName}/collections/${identifier}`;
  }

  /**
   * Saves the collection to the remote server
   * @returns 
   */
  $scope.saveCollection = async function () {

    try {
      // Needs initialized CM
      if (!$scope.collectionManager.isInitialized) {
        return;
      }

      let collection = $scope.collectionManager.activeCollection;

      // Check whether the form values are correct
      if (!DatabusCollectionUtils.checkCollectionForm($scope.form, collection)) {
        return;
      }

      // Look for an existing identifier
      var identifier = undefined;

      // Either take the identifier from the form (draft) or the collection uri (published)
      if (collection.isDraft) {
        identifier = $scope.form.identifier.value;
      } else {
        identifier = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri);
      }

      $scope.isSaving = true;
      $scope.collectionManager.updateCollection($scope.accountName, identifier).then(function (response) {
        DatabusAlert.alert($scope, true, DatabusMessages.CEDIT_COLLECTION_SAVED);
        $scope.isSaving = false;
        $scope.$apply();
      }).catch(function (err) {
        console.log(err);
        DatabusAlert.alert($scope, false, DatabusMessages.CEDIT_COLLECTION_SAVE_FAILED);
        $scope.isSaving = false;
        $scope.$apply();
      });

    } catch(err) {
      console.log(err);
      DatabusAlert.alert($scope, false, err);
    }
  }

  $scope.unpublishCollection = async function() {

    if($scope.collectionManager.activeCollection.isDraft) {
      return;
    }

    try {
      await $scope.collectionManager.unpublishActiveCollection();
      DatabusAlert.alert($scope, true, DatabusMessages.CEDIT_COLLECTION_UNPUBLISHED);
    } catch(err) {
      DatabusAlert.alert($scope, false, err);
      console.log(err);
    }
  }

  $scope.showDeleteModal = function () {
    $scope.deleteModalVisible = true;
  }

  $scope.hideDeleteModal = function () {
    $scope.deleteModalVisible = false;
  }

  $scope.deleteCollection = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    $scope.deleteModalVisible = false;

    $scope.collectionManager.deleteCollection($scope.username, $scope.form.identifier.value).then(function (response) {
      $scope.statusCode = response.code;
      $scope.collectionManager.selectFirstOrCreate();
      $scope.setActiveCollection($scope.collectionManager.activeCollection);
      $scope.$apply();
      $timeout($scope.resetStatus, $scope.modalTime);
    }).catch(function (err) {
      $scope.statusCode = err.code;
      $scope.$apply();
      $timeout($scope.resetStatus, $scope.modalTime);
    });
  }


  $scope.deleteLocally = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    if(!$scope.collectionManager.activeCollection.isDraft) {
      return;
    }

    $scope.collectionManager.deleteLocally();
    window.location.href = `/${$scope.accountName}/collections`;
  }

  $scope.downloadAsJson = function () {
    DatabusCollectionUtils.exportToJsonFile($scope.collectionManager.activeCollection);
  }

  /**
   * Discard local changes of the active collection and revert to the remote collection state
   * @returns 
   */
  $scope.discardChanges = function () {

    if(!$scope.collectionManager.activeCollection.hasLocalChanges) {
      return;
    }

    if($scope.collectionManager.activeCollection.isDraft) {
      return;
    }
    
    $scope.collectionManager.discardLocalChanges();
    DatabusAlert.alert($scope, true, DatabusMessages.CEDIT_LOCAL_CHANGES_DISCARDED);
  }


  $scope.showLoadFromJson = function () {
    $scope.isLoadFromJsonVisible = true;
  }

  $scope.hideLoadFromJson = function () {
    $scope.isLoadFromJsonVisible = false;
  }

  $scope.loadFromJsonString = '';

  $scope.loadFromJson = function (loadFromJsonString) {
    try {
      var toLoad = JSON.parse(loadFromJsonString);

      var target = $scope.collectionManager.activeCollection;
      target.title = toLoad.title;
      target.description = toLoad.description;
      target.abstract = toLoad.abstract;
      target.content = toLoad.content;

      DatabusAlert.alert($scope, true, DatabusMessages.CEDIT_COLLECTION_IMPORTED);
      $scope.isLoadFromJsonVisible = false;
    } catch (e) {
      $scope.statusCode = DatabusMessages.CEDIT_COLLECTION_IMPORT_FAILED;
      console.log(e);
    }
  }

  $scope.getCollectionJson = function () {
    var copy = DatabusCollectionUtils.createCleanCopy($scope.collectionManager.activeCollection);
    delete copy.uuid;
    return copy;
  }

  $scope.onActiveCollectionChanged();
}

