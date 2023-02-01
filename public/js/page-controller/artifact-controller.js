// hinzufügen eines Controllers zum Modul
function ArtifactPageController($scope, $http, $sce, collectionManager) {

  $scope.collectionManager = collectionManager;



  // TODO: Change this hacky BS!
  setTimeout(function () {
    $(".dropdown-item").click(function (e) {
      var dropdown = $(this).closest(".dropdown");
      $(dropdown).removeClass("is-active");
      e.stopPropagation();
    });


    $("body").click(function () {
      $(".dropdown").removeClass("is-active");
    });

    $(".dropdown").click(function (e) {
      $(".dropdown").removeClass("is-active");
      $(this).addClass("is-active");
      e.stopPropagation();
    });
  }, 500);


  $scope.formatUploadSize = function (size) {
    return Math.round(size * 100) / 100;
  };


  $scope.hideAutofill = function () {
    $scope.fileSelector.clearAutofill(function () {
      $scope.$apply();
    });
  }

  $scope.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  $scope.showCollectionModal = function () {
    $('#add-to-collection-modal').addClass('is-active');
  }

  $scope.hideCollectionModal = function () {
    $('#add-to-collection-modal').removeClass('is-active');
  }

  $scope.versions = data.versions;
  $scope.artifact = data.artifact;
  $scope.artifact.name = DatabusUtils.uriToName($scope.artifact.uri);

  //$scope.artifact.title = DatabusUtils.stringOrFallback($scope.artifact.title,
  //  $scope.artifact.latestVersionTitle);
  //$scope.artifact.abstract = DatabusUtils.stringOrFallback($scope.artifact.abstract,
  //  $scope.artifact.latestVersionAbstract);
  //$scope.artifact.description = DatabusUtils.stringOrFallback($scope.artifact.description,
  //  $scope.artifact.latestVersionDescription);

  $scope.publisherName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.artifact.uri, 2));
  $scope.canEdit = $scope.publisherName == data.auth.info.accountName;

  if (data.auth.authenticated && $scope.canEdit) {
    $scope.formData = {};
   
    $scope.formData.group = {};
    $scope.formData.group.name = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.artifact.uri));
   
    $scope.formData.artifact = {};
    $scope.formData.artifact.name = $scope.artifact.name;
    $scope.formData.artifact.title = $scope.artifact.title;
    $scope.formData.artifact.abstract = $scope.artifact.abstract;
    $scope.formData.artifact.description = $scope.artifact.description;

    $scope.dataidCreator = new DataIdCreator($scope.formData, data.auth.info.accountName);
  }

  $scope.resetEdits = function () {
    $scope.formData.artifact.title = $scope.artifact.title;
    $scope.formData.artifact.abstract = $scope.artifact.abstract;
    $scope.formData.artifact.description = $scope.artifact.description;
  }

  $scope.saveArtifact = async function () {

    if ($scope.dataidCreator == null) {
      return;
    }

    var artifactUpdate = $scope.dataidCreator.createArtifactUpdate();

    var response = await $http.put($scope.artifact.uri, artifactUpdate);

    if (response.status == 200) {
      $scope.artifact.title = $scope.formData.artifact.title;
      $scope.artifact.abstract = $scope.formData.artifact.abstract;
      $scope.artifact.description = $scope.formData.artifact.description;
      $scope.$apply();
    }
  }

  //not in data
  //$scope.artifactData = data.artifact;
  //$scope.dropDownData = data.dropDownData;
  //$scope.serviceData = data.services;
  //not in data

  $scope.tabs = {}
  $scope.tabs.activeTab = 0;
  $scope.authenticated = data.auth.authenticated;

  $scope.fileSelector = {};
  $scope.fileSelector.config = {};
  $scope.fileSelector.config.columns = [];
  $scope.fileSelector.config.columns.push({ field: 'version', label: 'Version', width: '30%' });
  $scope.fileSelector.config.columns.push({ field: 'variant', label: 'Variant', width: '30%' });
  $scope.fileSelector.config.columns.push({ field: 'format', label: 'Format', width: '12%' });
  $scope.fileSelector.config.columns.push({ field: 'compression', label: 'Compression', width: '12%' });

  $scope.artifactNode = new QueryNode($scope.artifact.uri, 'dataid:artifact');
  $scope.artifactNode.setFacet('http://purl.org/dc/terms/hasVersion', '$latest', true);

  $scope.groupNode = new QueryNode(DatabusUtils.navigateUp($scope.artifact.uri), 'dataid:group');
  $scope.groupNode.addChild($scope.artifactNode);

  $scope.collectionWidgetSelectionData = {};
  $scope.collectionWidgetSelectionData.groupNode = $scope.groupNode;

  $scope.onFacetSettingsChanged = function () {
    $scope.fileSelector.query = QueryBuilder.build({
      node: $scope.artifactNode,
      template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });

    $scope.fileSelector.fullQuery = QueryBuilder.build({
      node: $scope.artifactNode,
      template: QueryTemplates.GROUP_PAGE_FILE_BROWSER_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });
  }

  $scope.onFacetSettingsChanged();


  /*
  $scope.fileSelector = {};
  $scope.fileSelector.resourceUri = data.artifact.uri;
  $scope.fileSelector.parentSettings = null;
  $scope.fileSelector.settings = [];
  $scope.fileSelector.settings.push({
    facet : "http://purl.org/dc/terms/hasVersion",
    value : 'SYSTEM_LATEST_ARTIFACT_VERSION',
    checked : true
  });

  angular.element(function () {
    $('.sliderboy').slick({
      slidesToShow: 3,
      slidesToScroll: 3,
      infinite: false,
      dots: true,
      prevArrow: '<svg class="slick-prev" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z"/></svg>',
      nextArrow: '<svg class="slick-next" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"/></svg>',
    });
  });*/

  $scope.markdownToHtml = function (markdown) {

    var converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };

  
  $scope.onFileSelectionChanged = function (numFiles, totalSize) {
    $scope.fileSelector.numFiles = numFiles;
    $scope.fileSelector.totalSize = totalSize;

  };

  $scope.formatId = function (id) {
    return DatabusCollectionUtils.formatId(id);
  };

  $scope.formatDate = function (date) {
    return moment(date).format('MMM Do YYYY');
  };

  $scope.addArtifactNodeToCollection = function () {

    if ($scope.collectionManager.activeCollection == null) {
      return;
    }

    var wrapper = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);
    wrapper.addArtifactNode(
      $scope.artifact.uri,
      $scope.artifact.title,
      $scope.fileSelector.settings);

    $scope.collectionManager.saveLocally();
    $scope.statusCode = 1;
  };

  $scope.changeCollection = function (collection) {
    if (!$scope.authenticated) {
      return;
    }

    $scope.collectionManager.setActive(collection.uuid);
  }

  $scope.getStatusSuccess = function () {
    return true;
  }

  $scope.resetStatus = function () {
    $scope.statusCode = 0;
  }

  $scope.getStatusMessage = function (code) {
    return "File selection has been has been added to your collection.";
  }

}
