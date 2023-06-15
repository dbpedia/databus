const DatabusCollectionWrapper = require("../collections/databus-collection-wrapper");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const DataIdCreator = require("../publish/dataid-creator");
const QueryBuilder = require("../query-builder/query-builder");
const QueryNode = require("../query-builder/query-node");
const QueryTemplates = require("../query-builder/query-templates");
const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const TabNavigation = require("../utils/tab-navigation");

// hinzufügen eines Controllers zum Modul
function ArtifactPageController($scope, $http, $sce, $location, collectionManager) {

  $scope.collectionManager = collectionManager;
  $scope.authenticated = data.auth.authenticated;
  $scope.utils = new DatabusWebappUtils($scope, $sce);
  $scope.tabNavigation = new TabNavigation($scope, $location, [
    'files', 'versions', 'edit'
  ]);
  $scope.versions = data.versions;
  $scope.artifact = data.artifact;
  $scope.artifact.name = DatabusUtils.uriToName($scope.artifact.uri);
  $scope.publisherName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.artifact.uri, 2));
  $scope.canEdit = $scope.publisherName == data.auth.info.accountName;
 
  if (data.auth.authenticated && $scope.canEdit) {
    
    $scope.formData = {};
    $scope.formData.group = {};
    $scope.formData.group.name = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.artifact.uri));
    $scope.formData.artifact = {};

    var abstract = DatabusUtils.createAbstractFromDescription($scope.artifact.description);

    $scope.formData.artifact.generateAbstract = abstract == $scope.artifact.abstract;
    $scope.formData.artifact.name = $scope.artifact.name;
    $scope.formData.artifact.title = $scope.artifact.title;
    $scope.formData.artifact.abstract = $scope.artifact.abstract;
    $scope.formData.artifact.description = $scope.artifact.description;

    $scope.dataidCreator = new DataIdCreator($scope.formData, data.auth.info.accountName);
  }

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


  $scope.onFileSelectionChanged = function (numFiles, totalSize) {
    $scope.fileSelector.numFiles = numFiles;
    $scope.fileSelector.totalSize = totalSize;
  };

  $scope.formatId = function (id) {
    return DatabusCollectionUtils.formatId(id);
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


  $scope.hideAutofill = function () {
    $scope.fileSelector.clearAutofill(function () {
      $scope.$apply();
    });
  }


  $scope.onDescriptionChanged = function () {
    if ($scope.formData == null) {
      return;
    }

    if (!$scope.formData.artifact.generateAbstract) {
      return;
    }

    $scope.formData.artifact.abstract =
      DatabusUtils.createAbstractFromDescription($scope.formData.artifact.description);
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

    var relativeUri = new URL($scope.artifact.uri).pathname;
    var response = await $http.put(relativeUri, artifactUpdate);

    if (response.status == 200) {
      $scope.artifact.title = $scope.formData.artifact.title;
      $scope.artifact.abstract = $scope.formData.artifact.abstract;
      $scope.artifact.description = $scope.formData.artifact.description;

      DatabusAlert.alert($scope, true, "Artifact Saved!");
      $scope.$apply();
    }
  }


}


module.exports = ArtifactPageController;
