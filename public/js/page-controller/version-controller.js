
function VersionPageController($scope, $http, $sce, collectionManager) {

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

  /*
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

  $scope.tabs = {};
  $scope.tabs.activeTab = 0;

  $scope.collectionManager = collectionManager;
  $scope.actions = data.actions;
  $scope.versionGraph = JsonldUtils.getTypedGraph(data.version, DatabusUris.DATAID_VERSION); 

  $scope.version = {};
  $scope.version.uri = $scope.versionGraph[DatabusUris.JSONLD_ID];
  $scope.version.title = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DCT_TITLE);
  $scope.version.abstract = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DCT_ABSTRACT);
  $scope.version.description = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DCT_DESCRIPTION);
  $scope.version.artifact = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DATAID_ARTIFACT_PROPERTY);
  $scope.version.license = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DCT_LICENSE);
  $scope.version.issued = JsonldUtils.getProperty($scope.versionGraph, DatabusUris.DCT_ISSUED);
  $scope.version.name = DatabusUtils.uriToName($scope.version.uri);
  
  $scope.serviceData = data.services;
  $scope.modsData = data.mods;
  $scope.queryResult = {};
  $scope.addToCollectionQuery = "";
  $scope.authenticated = data.auth.authenticated;
  $scope.collectionModalVisible = false;

  $scope.publisherName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.version.uri, 3));
  $scope.canEdit = $scope.publisherName == data.auth.info.accountName;

  if (data.auth.authenticated && $scope.canEdit) {
    $scope.formData = {};

    $scope.formData.group = {};
    $scope.formData.group.name = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.version.uri, 2));

    $scope.formData.artifact = {};
    $scope.formData.artifact.name = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.version.uri, 1));

    var abstract = DatabusUtils.createAbstractFromDescription($scope.version.description);

    $scope.formData.version = {};
    $scope.formData.version.generateAbstract = abstract == $scope.version.abstract;
    $scope.formData.version.name = $scope.version.name;
    $scope.formData.version.title = $scope.version.title;
    $scope.formData.version.abstract = $scope.version.abstract;
    $scope.formData.version.description = $scope.version.description;
    $scope.formData.version.license = $scope.version.license;
    $scope.formData.version.attribution = $scope.version.attribution;

    $scope.formData.signature = {};
    $scope.formData.signature.autoGenerateSignature = true;
    $scope.formData.signature.selectedPublisherUri = $scope.version.publisher;

    $scope.dataidCreator = new DataIdCreator($scope.formData, data.auth.info.accountName);
  }

  $scope.onDescriptionChanged = function () {
    if ($scope.formData == null) {
      return;
    }

    if (!$scope.formData.version.generateAbstract) {
      return;
    }

    $scope.formData.version.abstract =
      DatabusUtils.createAbstractFromDescription($scope.formData.version.description);
  }

  $scope.resetEdits = function () {
    $scope.formData.version.title = $scope.version.title;
    $scope.formData.version.abstract = $scope.version.abstract;
    $scope.formData.version.description = $scope.version.description;
  }

  $scope.saveVersion = async function () {

    if ($scope.dataidCreator == null) {
      return;
    }

    JsonldUtils.setLiteral($scope.versionGraph, DatabusUris.DCT_TITLE, DatabusUris.XSD_STRING, 
      $scope.formData.version.title);

    var response = await $http.put($scope.version.uri, data.version);

    if (response.status == 200) {
      $scope.version.title = $scope.formData.version.title;
      $scope.version.abstract = $scope.formData.version.abstract;
      $scope.version.description = $scope.formData.version.description;

      DatabusAlert.alert($scope, true, "Version Saved!");
      $scope.$apply();
    }
  }

  $scope.modsAmountMinimized = 5;
  $scope.modsMaxAmount = $scope.modsAmountMinimized;

  $scope.showAllMods = function () {
    $scope.modsMaxAmount = 10000000;
  }

  $scope.hideAllMods = function () {
    $scope.modsMaxAmount = $scope.modsAmountMinimized;
  }

  $scope.fileSelector = {};
  $scope.fileSelector.config = {};
  $scope.fileSelector.config.columns = [];
  $scope.fileSelector.config.columns.push({ field: 'variant', label: 'Variant', width: '45%' });
  $scope.fileSelector.config.columns.push({ field: 'format', label: 'Format', width: '15%' });
  $scope.fileSelector.config.columns.push({ field: 'compression', label: 'Compression', width: '15%' });

  $scope.artifactNode = new QueryNode($scope.version.artifact, 'dataid:artifact');
  $scope.artifactNode.setFacet('http://purl.org/dc/terms/hasVersion', $scope.version.name, true);

  $scope.groupNode = new QueryNode(DatabusCollectionUtils.navigateUp($scope.version.artifact), 'dataid:group');
  $scope.groupNode.addChild($scope.artifactNode);

  $scope.collectionWidgetSelectionData = {};
  $scope.collectionWidgetSelectionData.groupNode = $scope.groupNode;

  $scope.onFacetSettingsChanged = function() {
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

  $scope.hideAutofill = function () {
    $scope.fileSelector.clearAutofill(function () {
      $scope.$apply();
    });
  }

  $scope.onFileSelectionChanged = function (numFiles, totalSize, query) {
    $scope.addToCollectionQuery = query;
  }

  $scope.showCollectionModal = function () {
    $scope.collectionModalVisible = true;
  }

  $scope.hideCollectionModal = function () {
    $scope.collectionModalVisible = false;
  }

  $scope.addFilter = function (selected, key) {
    $scope.fileSelector.addFilter(selected, key);
    $scope.updateQueryBuilder();
  }

  $scope.addQueryToCollection = function () {
    $scope.collectionManager.addElement($scope.queryBuilder.query);
    $scope.hideCollectionModal();
  };

  $scope.formatUploadSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };

  $scope.formatDate = function (date) {
    return moment(date).format('MMM Do YYYY');
  };

  $scope.formatId = function (id) {
    return DatabusCollectionUtils.formatId(id);
  };

  $scope.addQueryToCollection = function () {

    if ($scope.collectionManager.activeCollection == null) {
      return;
    }

    var wrapper = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);
    wrapper.addCustomQueryNode('Select ' + $scope.versionData.label + ' files', $scope.addToCollectionQuery);
    $scope.collectionManager.saveLocally();
    $scope.collectionModalVisible = false;
  }

  $scope.formatMods = function (results) {
    var mods = results.replace(",", "&nbsp;");
    return $sce.trustAsHtml(mods);
  }

  $scope.formatModFile = function (uri) {
    return DatabusCollectionUtils.uriToName(uri);
  }

  $scope.markdownToHtml = function (markdown) {

    var converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };
}
