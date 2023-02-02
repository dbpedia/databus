function GroupPageController($scope, $http, $sce, $interval, collectionManager) {

  $scope.group = data.group;
  $scope.artifacts = data.artifacts;
  $scope.services = data.services;
  $scope.group.name = DatabusUtils.uriToName($scope.group.uri);
  $scope.publisherName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.group.uri));

  $scope.group.hasData = false;

  for (var artifact of $scope.artifacts) {
    if (artifact.latestVersionDate != undefined) {
      $scope.group.hasData = true;
    }
  }

  $scope.group.title = DatabusUtils.stringOrFallback($scope.group.title,
    DatabusUtils.uriToTitle($scope.group.uri));



  for (var artifact of $scope.artifacts) {
    artifact.title = DatabusUtils.stringOrFallback(artifact.title, artifact.latestVersionTitle);
    artifact.abstract = DatabusUtils.stringOrFallback(artifact.abstract, artifact.latestVersionAbstract);
    artifact.description = DatabusUtils.stringOrFallback(artifact.description, artifact.latestVersionDescription);
  }

  $scope.canEdit = $scope.publisherName == data.auth.info.accountName;

  if (data.auth.authenticated && $scope.canEdit) {

    var abstract = DatabusUtils.createAbstractFromDescription($scope.group.description);

    $scope.formData = {};
    $scope.formData.group = {};
    $scope.formData.group.generateAbstract = abstract == $scope.group.abstract;
    $scope.formData.group.name = $scope.group.name;
    $scope.formData.group.title = $scope.group.title;
    $scope.formData.group.abstract = $scope.group.abstract;
    $scope.formData.group.description = $scope.group.description;

    $scope.dataidCreator = new DataIdCreator($scope.formData, data.auth.info.accountName);
  }

  $scope.onDescriptionChanged = function () {
    if ($scope.formData == null) {
      return;
    }

    if (!$scope.formData.group.generateAbstract) {
      return;
    }

    $scope.formData.group.abstract =
      DatabusUtils.createAbstractFromDescription($scope.formData.group.description);
  }

  $scope.resetEdits = function () {
    $scope.formData.group.title = $scope.group.title;
    $scope.formData.group.abstract = $scope.group.abstract;
    $scope.formData.group.description = $scope.group.description;
  }

  $scope.saveGroup = async function () {

    if ($scope.dataidCreator == null) {
      return;
    }

    var groupUpdate = $scope.dataidCreator.createGroupUpdate();

    var response = await $http.put($scope.group.uri, groupUpdate);

    if (response.status == 200) {
      $scope.group.title = $scope.formData.group.title;
      $scope.group.abstract = $scope.formData.group.abstract;
      $scope.group.description = $scope.formData.group.description;
      DatabusAlert.alert($scope, true, "Group Saved!");
      $scope.$apply();
    }
  }

  $scope.facetsView = {};
  $scope.facetsView.resourceUri = $scope.group.uri;
  $scope.facetsView.settings = [];
  $scope.facetsView.parentSettings = null;
  $scope.tabs = {};
  $scope.tabs.activeTab = 0;
  $scope.authenticated = data.auth.authenticated;
  $scope.selection = [];

  $scope.searchInput = '';
  $scope.searchCooldown = 500;
  $scope.searchChanged = true;
  $scope.searchReady = true;

  $scope.fileSelector = {};
  $scope.fileSelector.config = {};
  $scope.fileSelector.config.columns = [];
  $scope.fileSelector.config.columns.push({ field: 'artifact', label: 'Artifact', width: '32%', uriToName: true });
  $scope.fileSelector.config.columns.push({ field: 'version', label: 'Version', width: '12%' });
  $scope.fileSelector.config.columns.push({ field: 'variant', label: 'Variant', width: '17%' });
  $scope.fileSelector.config.columns.push({ field: 'format', label: 'Format', width: '8%' });
  $scope.fileSelector.config.columns.push({ field: 'compression', label: 'Compression', width: '10%' });

  $scope.groupNode = new QueryNode($scope.group.uri, 'dataid:group');
  $scope.groupNode.setFacet('http://purl.org/dc/terms/hasVersion', '$latest', true);

  $scope.onFacetSettingsChanged = function () {
    $scope.fileSelector.query = QueryBuilder.build({
      node: $scope.groupNode,
      template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });

    $scope.fileSelector.fullQuery = QueryBuilder.build({
      node: $scope.groupNode,
      template: QueryTemplates.GROUP_PAGE_FILE_BROWSER_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });
  }

  // $scope.onFacetSettingsChanged();

  $scope.collectionWidgetSelectionData = {};
  $scope.collectionWidgetSelectionData.groupNode = $scope.groupNode;

  $scope.onFileQueryResult = function (args) {
    if (args == null) return;
    $scope.collectionWidgetSelectionData.query = args.query;
  }

  $scope.collectionManager = collectionManager;

  $scope.findArtifact = function (uri) {
    return $scope.artifacts.find(function (a) { a.uri === uri; });
  }

  $scope.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  $scope.formatDate = function (date) {
    return moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
  };

  $scope.formatLicense = function (licenseUri) {
    var licenseName = DatabusUtils.uriToName(licenseUri);

    var html = '<div class="license-icon">' + licenseName + '</div>'
    return $sce.trustAsHtml(html);
  }

  for (var a in $scope.artifacts) {
    $scope.artifacts[a].date = $scope.formatDate($scope.artifacts[a].date);
    $scope.artifacts[a].licenseTag = $scope.formatLicense($scope.artifacts[a].license);
  }

  $scope.setSelectionStateAll = function (val) {
    if (val) {
      for (var a in $scope.artifacts) {
        $scope.select($scope.artifacts[a]);
      }
    } else {
      for (var a in $scope.artifacts) {
        $scope.deselect($scope.artifacts[a]);
      }
    }
  }

  $scope.toggleSelect = function (artifact) {
    if ($scope.isSelected(artifact)) {
      $scope.deselect(artifact);
    } else {
      $scope.select(artifact);
    }
  }

  $scope.select = function (artifact) {
    artifact.isSelected = true;
    $scope.selection.push(artifact.uri);
  }

  $scope.deselect = function (artifact) {
    artifact.isSelected = false;
    $scope.selection = $scope.selection.filter(function (value, index, arr) {
      return value !== artifact.uri;
    });
  }

  $scope.isSelected = function (artifact) {
    for (var s in $scope.selection) {
      if ($scope.selection[s] === artifact.uri) {
        return true;
      }
    }
    return false;
  }

  $scope.changeCollection = function (collection) {
    $scope.collectionManager.setActive(collection.uuid);
    $scope.search();
  }

  $scope.showCollectionModal = function () {
    $('#add-to-collection-modal').addClass('is-active');
  }

  $scope.hideCollectionModal = function () {
    $('#add-to-collection-modal').removeClass('is-active');
  }

  $scope.markdownToHtml = function (markdown) {

    var converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };


  $scope.invokeSearch = function () {
    if ($scope.searchReady) {
      $scope.search();
      $scope.searchReady = false;
    } else {
      $scope.searchChanged = true;
    }
  }

  $interval(function () {
    if ($scope.searchChanged) {
      $scope.search();
      $scope.searchChanged = false;
    }
    $scope.searchReady = true;
  }, $scope.searchCooldown);


  $scope.addSelectionToCollection = function () {

    if ($scope.collectionManager.activeCollection == null) {
      return;
    }

    var wrapper = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);

    for (var s in $scope.selection) {
      var artifact = $scope.artifacts.find(function (a) { return a.uri === $scope.selection[s]; });
      wrapper.addArtifactNode(artifact.uri, artifact.label);
    }
    $scope.collectionManager.saveLocally();
    $scope.search();
  }

  $scope.updateArtifactState = function (wrapper, artifact) {
    artifact.alreadyAdded = wrapper.hasArtifact(artifact.uri);
    artifact.isSelected = artifact.alreadyAdded || $scope.selection.includes(artifact.uri);
  }

  $scope.search = function () {

    $scope.searchResult = [];

    /** 
    if ($scope.searchInput === '') {
      // $scope.artifacts = data.artifacts;

      if ($scope.collectionManager.activeCollection == null) {
        return;
      }

      for (var a in $scope.artifacts) {
        var wrapper = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);
        $scope.updateArtifactState(wrapper, $scope.artifacts[a]);
      }

      return;
    }*/

    var typeFilters = `&publisher=${$scope.publisherName}&publisherWeight=0&typeName=Artifact&typeNameWeight=0&group=${$scope.group.name}&minRelevance=0.1`;

    $http({
      method: 'GET',
      url: '/api/search?query=' + $scope.searchInput + typeFilters
    }).then(function successCallback(response) {

      for (var r in response.data.docs) {
        var result = response.data.docs[r];

        for (var artifact of $scope.artifacts) {
          if (result.resource[0] == artifact.uri) {
            $scope.searchResult.push(artifact);
          }
        }
      }
    }, function errorCallback(response) {
    });
  }
}
