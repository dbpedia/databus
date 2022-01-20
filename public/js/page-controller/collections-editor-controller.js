// hinzufügen eines Controllers zum Modul
function CollectionsEditorController($scope, $timeout, $http, $location, collectionManager) {

  $scope.authenticated = data.auth.authenticated;
  $scope.accountName = data.auth.info.accountName;
  $scope.location = $location;

  $scope.$watch("location.hash()", function (newVal, oldVal) {

    if ($scope.session == undefined) {
      return;
    }

    if (newVal == 'import') {
      $scope.session.activeTab = 5;
      return;
    }

    if (newVal == 'add') {
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

    if (newVal == 'edit') {
      $scope.session.activeTab = 1;
      return;
    }

    $scope.session.activeTab = 0;

  }, true);

  $scope.goToTab = function (value) {
    $location.hash(value);
    window.scrollTo(0, 0);
  }

  $scope.logMeIn = function () {
    window.location = '/system/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.createAccount = function () {
    window.location = '/system/account';
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

  $scope.session = JSON.parse(window.sessionStorage.getItem(`databus_collection_editor_session_${data.auth.info.accountName}`));

  if ($scope.session == undefined) {
    $scope.session = {};
    $scope.session.activeTab = 0;
    $scope.session.showDescription = true;

    if (collectionManager.activeCollection.content.generatedQuery != undefined) {
      $scope.session.showGroups = collectionManager.activeCollection.content.generatedQuery.root.childNodes.length > 0;
    }

    if (collectionManager.activeCollection.content.customQueries != undefined) {
      $scope.session.showQueries = collectionManager.activeCollection.content.customQueries.length > 0;
    }
  }


  if (collectionManager.activeCollection.content.generatedQuery != undefined) {
    if (collectionManager.activeCollection.content.generatedQuery.root.childNodes.length == 0) {
      $scope.session.showGroups = false;
    }
  }

  if (collectionManager.activeCollection.content.customQueries != undefined) {
    if (collectionManager.activeCollection.content.customQueries.length == 0) {
      $scope.session.showQueries = false;
    }
  }

  $scope.$watch('statusCode', function (newVal, oldVal) {

    if ($scope.timer != null) {
      $timeout.cancel($scope.timer);
    }

    if ($scope.statusCode != 0) {
      $scope.timer = $timeout(function () {
        $scope.statusCode = 0;
      }, 2000);
    }

  }, true);


  $scope.$watch('session', function (newVal, oldVal) {
    window.sessionStorage.setItem('databus_collection_editor_session', JSON.stringify($scope.session));
  }, true);

  $scope.form = {};
  $scope.form.label = {};
  $scope.form.identifier = {};
  $scope.form.abstract = {};
  $scope.form.description = {};
  $scope.form.collectionPublishTag = '';

  $scope.artifactData = {};
  $scope.username = data.auth.info.accountName;
  $scope.modalTime = 1000;

  $scope.onAddContent = function(source) {
    $scope.session.targetDatabusUrl = source;
    $scope.goToTab('add');
  }

  $scope.updateStatistics = function (collection) {
    if (collection.uri === undefined) {
      $scope.statistics = null;
      $scope.files = null;
      return;
    }
    /*
    $http.get('/system/collections/collection-statistics', { params: { uri: collection.uri } }).then(function (result) {
      for (let i in result.data.files) {
        $scope.collectionFiles += result.data.files[i].downloadURLs + "\n";
      }

      $scope.statistics = result.data;
      $scope.statistics.label = $scope.collectionManager.activeCollection.label;
      $scope.statistics.uri = $scope.collectionManager.activeCollection.uri;
      $scope.statistics.description = $scope.collectionManager.activeCollection.description;
      $scope.files = result.data.files;
    }).catch(function (err) {
      $scope.statistics = null;
      $scope.files = null;
    });*/
  }

  $scope.removeCustomNode = function (node) {

    var collection = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);
    collection.removeCustomQueryNode(node);
    $scope.onActiveCollectionChanged();
  }

  $scope.addCustomNode = function () {

    var collection = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);

    collection.addCustomQueryNode('New Query', 'PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n\
PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n\
PREFIX dct: <http://purl.org/dc/terms/>\n\
PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\
\n\
# Get all files\n\
SELECT DISTINCT ?file WHERE {\n\
  ?dataset dataid:artifact <https://databus.dbpedia.org/dbpedia/publication/strategy> .\n\
  ?dataset dcat:distribution ?distribution .\n\
  ?distribution dcat:downloadURL ?file .\n\
}');
    $scope.session.showQueries = true;
    $scope.onActiveCollectionChanged();
  }


  $scope.onCollectionClicked = function (collection) {
    // if already active
    if (collection.uuid == $scope.collectionManager.activeCollection.uuid && $scope.session.activeTab == 0) {
      $scope.goToTab('edit');
    }

    $scope.setActiveCollection(collection);
  }

  $scope.setActiveCollection = function (collection) {



    if (collection.uuid != $scope.collectionManager.activeCollection.uuid) {
      $scope.collectionManager.setActive(collection.uuid);
      $scope.updateStatistics(collection);
      $scope.form.identifier.value = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri)

    }

  }

  $scope.addDatabusToCollection = function () {

    if ($scope.collectionManager.activeCollection == undefined) {
      return;
    }

    var req = {
      method: 'GET',
      url: $scope.session.databusUriToAdd,
      headers: {
        'Accept': 'application/rdf+turtle'
      }
    }

    $http(req).then(function (res) {
      const parser = new N3.Parser();
      parser.parse(res.data,
        (error, quad, prefixes) => {
          if (quad) {

            var resultUrl = new URL(quad.subject.id);
            var expectedUrl = new URL($scope.session.databusUriToAdd);

            if (resultUrl.href == expectedUrl.href
              && quad.predicate.id == `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`
              && quad.object.id == `http://dataid.dbpedia.org/ns/core#Databus`) {

              // It is indeed a Databus!
              var rootNode = QueryNode.createFrom($scope.collectionManager.activeCollection.content.generatedQuery.root);
              
              var url = (resultUrl.href.substr(-1) === '/') ? resultUrl.href.slice(0, -1) : resultUrl.href;
              rootNode.addChild(new QueryNode(url, null));

              $scope.onActiveCollectionChanged();
              $scope.$apply();
            }
          }
        });


    });


    // check for valid Databus

    //var rootNode = QueryNode.createFrom($scope.collectionManager.activeCollection.content.generatedQuery.root);
    //rootNode.addChild(new QueryNode($scope.session.databusUriToAdd, null));
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
        $scope.statusCode = success ? 2006 : 916;

        if (success) {
          $scope.isCreateNewModalVisible = false;
        }
      });
  }

  $scope.editCopy = function () {
    var copy = $scope.collectionManager.createCopy($scope.collectionManager.activeCollection);
    $scope.collectionManager.setActive(copy.uuid);
  }

  $scope.createCollection = function () {

    if (!$scope.collectionManager.isInitialized) {
      return;
    }

    var invalidIdentifier = false;

    if (!DatabusCollectionUtils.checkIdentifier($scope.form.identifier.value)) {
      $scope.form.identifier.error = DatabusResponse.COLLECTION_INVALID_ID;
      invalidIdentifier = true;
    }

    if (!DatabusCollectionUtils.checkCollectionForm($scope.form, $scope.collectionManager.activeCollection)
      || invalidIdentifier) {
      return;
    }

    $scope.isSaving = true;

    $scope.collectionManager.commitCollection($scope.username, $scope.form.identifier.value)
      .then(function (response) {
        $scope.statusCode = response.code;
        $scope.isSaving = false;
        $scope.$apply();
        $scope.updateStatistics($scope.collectionManager.activeCollection);
        $timeout($scope.resetStatus, $scope.modalTime);
      }).catch(function (err) {
        $scope.statusCode = err.code;
        $scope.isSaving = false;
        $scope.$apply();
        $timeout($scope.resetStatus, $scope.modalTime);
      });
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
      $scope.statusCode = DatabusResponse.COLLECTION_UPDATED;
      $scope.isSaving = false;
      $scope.$apply();
      $scope.updateStatistics($scope.collectionManager.activeCollection);
      $timeout($scope.resetStatus, $scope.modalTime);
    }).catch(function (err) {
      $scope.statusCode = err.code;
      $scope.isSaving = false;
      $scope.$apply();
      $timeout($scope.resetStatus, $scope.modalTime);
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

  $scope.unHideCollection = function () {

    var identifier = undefined;

    if ($scope.collectionManager.activeCollection.uri != undefined) {
      identifier = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri);
    }

    if (identifier == undefined) {
      return;
    }

    $scope.collectionManager.unHideCollection($scope.username, identifier).then(function (response) {
      $scope.statusCode = DatabusResponse.COLLECTION_PUBLISHED;
      $scope.$apply();
      $timeout($scope.resetStatus, $scope.modalTime);
    }).catch(function (err) {
      $scope.statusCode = err.code;
      $scope.$apply();
      $timeout($scope.resetStatus, $scope.modalTime);
    });
  }

  $scope.hideCollection = function () {

    var identifier = undefined;

    if ($scope.collectionManager.activeCollection.uri != undefined) {
      identifier = DatabusUtils.uriToName($scope.collectionManager.activeCollection.uri);
    }

    if (identifier == undefined) {
      return;
    }

    $scope.collectionManager.hideCollection($scope.username, identifier).then(function (response) {
      $scope.statusCode = DatabusResponse.COLLECTION_UNPUBLISHED;
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
    $http.get(`/system/pages/account/collections?account=${$scope.accountName}`).then(function (res) {

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
      target.label = toLoad.label;
      target.description = toLoad.description;
      target.abstract = toLoad.abstract;
      target.content = toLoad.content;
      $scope.statusCode = DatabusResponse.COLLECTION_IMPORTED;

      $scope.isLoadFromJsonVisible = false;
    } catch (e) {
      $scope.statusCode = DatabusResponse.COLLECTION_IMPORTED_FAILED
    }
  }
}
