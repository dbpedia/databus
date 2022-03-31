
function VersionPageController($scope, $sce, collectionManager) {

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

  $scope.collectionManager = collectionManager;
  $scope.actions = data.actions;
  $scope.versionData = data.version;
  $scope.serviceData = data.services;
  $scope.modsData = data.mods;
  $scope.queryResult = {};
  $scope.addToCollectionQuery = "";
  $scope.authenticated = data.auth.authenticated;
  $scope.collectionModalVisible = false;

  $scope.versionData.publisherUri = DatabusUtils.navigateUp(DatabusUtils.navigateUp($scope.versionData.artifactUri));
  $scope.versionData.publisher = DatabusUtils.uriToName($scope.versionData.publisherUri);

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

  $scope.artifactNode = new QueryNode($scope.versionData.artifactUri, 'dataid:artifact');
  $scope.artifactNode.setFacet('http://purl.org/dc/terms/hasVersion', $scope.versionData.version, true);

  $scope.groupNode = new QueryNode(DatabusCollectionUtils.navigateUp($scope.versionData.uri), 'dataid:group');
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
