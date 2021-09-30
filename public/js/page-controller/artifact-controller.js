// hinzufügen eines Controllers zum Modul
function ArtifactPageController($scope, $sce, collectionManager) {

  $scope.collectionManager = collectionManager;

  // TODO: Change this hacky BS!
  setTimeout(function() {
    $( ".dropdown-item" ).click(function(e) {
       var dropdown = $( this ).closest( ".dropdown" );
       $( dropdown ).removeClass( "is-active" );
       e.stopPropagation();
     });


    $( "body" ).click(function() {
      $( ".dropdown" ).removeClass("is-active");
    });

    $( ".dropdown" ).click(function(e) {
      $( ".dropdown" ).removeClass("is-active");
      $( this ).addClass( "is-active" );
      e.stopPropagation();
    });
  }, 500);


  $scope.formatUploadSize = function(size) {
    return Math.round(size * 100) / 100;
  };


  $scope.hideAutofill = function() {
    $scope.fileSelector.clearAutofill(function() {
      $scope.$apply();
    });
  }

  $scope.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  $scope.showCollectionModal = function() {
    $( '#add-to-collection-modal' ).addClass('is-active');
  }

  $scope.hideCollectionModal = function() {
    $( '#add-to-collection-modal' ).removeClass('is-active');
  }

  $scope.latestVersionData = data.versions[0];
  $scope.versionsData = data.versions;
  $scope.artifactURI = DatabusUtils.navigateUp($scope.latestVersionData.versionUri);

  //not in data
  //$scope.artifactData = data.artifact;
  //$scope.dropDownData = data.dropDownData;
  //$scope.serviceData = data.services;
  //not in data

  $scope.activeTab = 0;
  $scope.authenticated = data.auth.authenticated;

  $scope.fileSelector = {};
  $scope.fileSelector.config = {};
  $scope.fileSelector.config.columns = [];
  $scope.fileSelector.config.columns.push({ field : 'version', label : 'Version', width: '25%' });
  $scope.fileSelector.config.columns.push({ field : 'variant', label : 'Variant', width: '17%' });
  $scope.fileSelector.config.columns.push({ field : 'format', label : 'Format', width: '10%' });
  $scope.fileSelector.config.columns.push({ field : 'compression', label : 'Compression', width: '15%' });

  var fileQueryBuilder = new QueryBuilder();

  $scope.artifactNode = new QueryNode($scope.artifactURI, 'dataid:artifact');
  $scope.artifactNode.setFacet('http://purl.org/dc/terms/hasVersion', '$latest', true);

  $scope.groupNode = new QueryNode(DatabusUtils.navigateUp($scope.artifactURI), 'dataid:group');
  $scope.groupNode.addChild($scope.artifactNode);

  $scope.collectionWidgetSelectionData = {};
  $scope.collectionWidgetSelectionData.groupNode =  $scope.groupNode;

  $scope.fileSelector.query = fileQueryBuilder.createFileQuery($scope.artifactNode);
  $scope.fileSelector.fullQuery = fileQueryBuilder.createFullQuery($scope.artifactNode);

  $scope.onFacetSettingsChanged = function() {
    $scope.fileSelector.query = fileQueryBuilder.createFileQuery($scope.artifactNode);
    $scope.fileSelector.fullQuery = fileQueryBuilder.createFullQuery($scope.artifactNode);
  }


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


  $scope.onFileSelectionChanged = function(numFiles, totalSize) {
    $scope.fileSelector.numFiles = numFiles;
    $scope.fileSelector.totalSize = totalSize;

  };

  $scope.formatId = function(id) {
    return DatabusCollectionUtils.formatId(id);
  };

  $scope.formatDate = function(date) {
    return moment(date).format('MMM Do YYYY');
  };

  $scope.addArtifactNodeToCollection = function() {

    if($scope.collectionManager.activeCollection == null) {
      return;
    }

    var wrapper = new DatabusCollectionWrapper($scope.collectionManager.activeCollection);
    wrapper.addArtifactNode(
      $scope.artifactURI,
      $scope.latestVersionData.label,
      $scope.fileSelector.settings);

    $scope.collectionManager.saveLocally();
    $scope.statusCode = 1;
  };

  $scope.changeCollection = function (collection) {
    if(!$scope.authenticated) {
      return;
    }

    $scope.collectionManager.setActive(collection.uuid);
  }

  $scope.getStatusSuccess = function() {
    return true;
  }

  $scope.resetStatus = function() {
    $scope.statusCode = 0;
  }

  $scope.getStatusMessage = function(code) {
    return "File selection has been has been added to your collection.";
  }

}
