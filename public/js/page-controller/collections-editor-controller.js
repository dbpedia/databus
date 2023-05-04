// hinzufügen eines Controllers zum Modul
function CollectionsEditorController($scope, $timeout, $http, $location, collectionManager) {

  $scope.authenticated = data.auth.authenticated;
  $scope.accountName = data.auth.info.accountName;
  $scope.location = $location;
  $scope.baseUrl = DATABUS_RESOURCE_BASE_URL;

  /**
   * Generates an abstract from the description. Triggered when the description field gets changed.
   * @returns 
   */
  $scope.onDescriptionChanged = function () {
    if ($scope.form == null) {
      return;
    }

    if ($scope.form.generateAbstract) {
      $scope.collectionManager.activeCollection.abstract =
        DatabusUtils.createAbstractFromDescription($scope.collectionManager.activeCollection.description);
    }

    $scope.onActiveCollectionChanged();
  }

  $scope.search = {};
  $scope.search.title = "";

  /**
   * Watch for the current location hash to navigate betweem tabs
   */
  $scope.$watch("location.hash()", function (newVal, oldVal) {

    if ($scope.session == undefined) {
      return;
    }

    if (newVal == 'import') {
      $scope.session.activeTab = 4;
      return;
    }

    if (newVal == 'query') {
      $scope.session.activeTab = 3;
      return;
    }

    if (newVal == 'preview') {
      $scope.session.activeTab = 2;
      return;
    }

    if (newVal == 'content') {
      $scope.session.activeTab = 1;
      return;
    }

    if (newVal == 'docu') {
      $scope.session.activeTab = 0;
      return;
    }


  }, true);

  /**
   * Change the tab - set location hash and scroll up
   * @param {*} value 
   */
  $scope.goToTab = function (value) {
    $location.hash(value);
    window.scrollTo(0, 0);
  }

  $scope.logMeIn = function () {
    window.location = '/system/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.createAccount = function () {
    window.location = '/app/account';
  }

  if (!$scope.authenticated) {
    return;
  }

  $scope.hasAccount = data.auth.info.accountName != undefined;;

  if (!$scope.hasAccount) {
    return;
  }

  $scope.getCollectionJson = function () {
    var copy = DatabusCollectionUtils.createCleanCopy($scope.collectionManager.activeCollection);
    delete copy.uuid;

    return copy;
  }

  $scope.collectionManager = collectionManager;

  $scope.collectionQuery = new DatabusCollectionWrapper($scope.collectionManager.activeCollection).createQuery();
  $scope.collectionJson = $scope.getCollectionJson();

  var storageKeySession = `databus_collection_editor_session_${data.auth.info.accountName}`;
  $scope.session = JSON.parse(window.sessionStorage.getItem(storageKeySession));

  if ($scope.session == undefined) {
    $scope.session = {};
    $scope.session.activeTab = 0;
    $scope.session.showDescription = true;
    $scope.session.showGroups = true;
  }

  $scope.$watch('session', function (newVal, oldVal) {
    window.sessionStorage.setItem(storageKeySession, JSON.stringify($scope.session));
  }, true);

  /**

  $scope.$watch('statusCode', function (newVal, oldVal) {

    if ($scope.timer != null) {
      $timeout.cancel($scope.timer);
    }

    if ($scope.statusCode != 0) {
      $scope.timer = $timeout(function () {
        $scope.statusCode = 0;
      }, 2000);
    }

  }, true); */

  /**
   * Form data object for input errors, etc
   */
  $scope.form = {};
  $scope.form.title = {};
  $scope.form.identifier = {};
  $scope.form.description = {};
  $scope.form.isHidden = $scope.collectionManager.activeCollection.issued == undefined;
  $scope.form.collectionPublishTag = '';
  $scope.form.generateAbstract = $scope.collectionManager.activeCollection.abstract ==
    DatabusUtils.createAbstractFromDescription($scope.collectionManager.activeCollection.description);


  $scope.username = data.auth.info.accountName;

  /**
   * Collection clicked in the collection list view
   */
  $scope.onCollectionClicked = function (collection) {

    $scope.setActiveCollection(collection);
    if (collection.uuid == $scope.collectionManager.activeCollection.uuid && $scope.session.activeTab == 0) {
      $scope.goToTab('docu');
    }

  }


  $scope.setActiveCollection = function (collection) {
    if (collection.uuid != $scope.collectionManager.activeCollection.uuid) {
      $scope.collectionManager.setActive(collection.uuid);
      $scope.form.identifier.value = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri)
    }
  }

  $scope.collectionManager.onCollectionChangedInDifferentTab = function () {

  }



  $scope.doStuffWhenInitialized = function () {
    if ($scope.collectionManager.activeCollection == null) {
      $scope.collectionManager.selectFirstOrCreate();
    }

    $scope.setActiveCollection($scope.collectionManager.activeCollection);
  }

  if (collectionManager.isInitialized) {
    $scope.doStuffWhenInitialized()
  } else {
    collectionManager.onReady = $scope.doStuffWhenInitialized;
  }

  $scope.onActiveCollectionChanged = function () {
    $scope.collectionManager.saveLocally();
    let collection = $scope.collectionManager.activeCollection;

    $scope.collectionQuery = new DatabusCollectionWrapper(collection).createQuery();
    $scope.collectionJson = $scope.getCollectionJson();

    if (collection != null) {
      collection.hasLocalChanges = $scope.collectionManager.hasLocalChanges(collection);
    }
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
    window.location.href = '/' + $scope.username + '/collections/'
      + $scope.collectionManager.activeCollection.id;
  }

  $scope.createNewCollection = function () {
    $scope.collectionManager.createNew('New Collection', 'Replace this description with a description of your choice.',
      function (success) {
        DatabusAlert.alert($scope, true, "A new collection has been created.");
      });
  }

  $scope.editCopy = function () {
    var copy = $scope.collectionManager.createCopy($scope.collectionManager.activeCollection);
    $scope.collectionManager.setActive(copy.uuid);
  }

  $scope.saveCollection = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    var identifier = undefined;

    if ($scope.collectionManager.activeCollection.uri != undefined) {
      identifier = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri);
    }

    if (identifier == undefined) {
      if (!DatabusCollectionUtils.checkIdentifier($scope.form.identifier.value)) {
        $scope.form.identifier.error = DatabusResponse.COLLECTION_INVALID_ID;
      } else {
        $scope.form.identifier.error = undefined;
        identifier = $scope.form.identifier.value;
      }
    }

    if (!DatabusCollectionUtils.checkCollectionForm($scope.form, $scope.collectionManager.activeCollection)
      || identifier == undefined) {
      return;
    }

    $scope.isSaving = true;
    $scope.collectionManager.updateCollection($scope.username, identifier).then(function (response) {
      DatabusAlert.alert($scope, true, "Collection saved successfully.");
      $scope.isSaving = false;
      $scope.$apply();
      // $scope.updateStatistics($scope.collectionManager.activeCollection);
      $timeout($scope.resetStatus, $scope.modalTime);
    }).catch(function (err) {
      DatabusAlert.alert($scope, false, err);
      $scope.isSaving = false;
      $scope.$apply();
    });
  }

  $scope.createDraft = function () {
    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    $scope.collectionManager.createDraft(function (response) {
      $scope.statusCode = response;
      $scope.isSaving = false;
      $timeout($scope.resetStatus, $scope.modalTime);
    });
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

    $scope.collectionManager.deleteLocally(function (response) {
      $scope.statusCode = response.code;
    });
  }

  $scope.downloadAsJson = function () {
    DatabusCollectionUtils.exportToJsonFile($scope.collectionManager.activeCollection);
  }

  $scope.discardChanges = function () {

    $scope.isDoingCommitWork = true;

    // reload remote
    $http.get(`/app/account/collections?account=${$scope.accountName}`).then(function (res) {

      $scope.collectionManager.discardLocalChanges(res.data);
      $scope.statusCode = DatabusResponse.COLLECTION_LOCAL_CHANGES_DISCARDED;
      $scope.isDoingCommitWork = false;

    });
  }


  $scope.queryToClipboard = function () {
    var query = DatabusCollectionUtils.createQueryString($scope.collectionManager.activeCollection);
    DatabusCollectionUtils.copyStringToClipboard(query);
    $scope.statusCode = DatabusResponse.COLLECTION_QUERY_COPIED_TO_CLIPBOARD;
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
      target.content = toLoad.content;
      $scope.statusCode = DatabusResponse.COLLECTION_IMPORTED;

      $scope.isLoadFromJsonVisible = false;
    } catch (e) {
      $scope.statusCode = DatabusResponse.COLLECTION_IMPORTED_FAILED
    }
  }
}
