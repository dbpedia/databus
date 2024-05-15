const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const JsonldUtils = require("../utils/jsonld-utils");
const DatabusUtils = require("../utils/databus-utils");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const QueryNode = require("../query-builder/query-node");
const TabNavigation = require("../utils/tab-navigation");
const DatabusUris = require("../utils/databus-uris");
const DataIdCreator = require("../publish/dataid-creator");
const QueryTemplates = require("../query-builder/query-templates");
const DatabusCollectionWrapper = require("../collections/databus-collection-wrapper");
const QueryBuilder = require("../query-builder/query-builder");
const AppJsonFormatter = require("../utils/app-json-formatter");

function VersionPageController($scope, $http, $sce, $location, collectionManager) {

  $scope.navigation = new TabNavigation($scope, $location, [
    'files', 'mods', 'edit'
  ]);

  $scope.utils = new DatabusWebappUtils($scope, $sce);
  $scope.collectionManager = collectionManager;
  $scope.authenticated = data.auth.authenticated;
  $scope.versionGraph = data.graph;
  $scope.version = AppJsonFormatter.formatVersionData(data.graph);

  $scope.queryResult = {};
  $scope.addToCollectionQuery = "";
  $scope.collectionModalVisible = false;

  $scope.publisherName = DatabusUtils.uriToName(DatabusUtils.navigateUp($scope.version.uri, 3));
  $scope.canEdit = $scope.publisherName == data.auth.info.accountName;

  if (data.auth.authenticated && $scope.canEdit) {

    $scope.licenseQuery = "";
    $scope.filterLicenses = function (licenseQuery) {

      if (data.licenseData == null) {
        return;
      }

      // billo-suche mit lowercase und tokenization 
      var tokens = licenseQuery.toLowerCase().split(' ');
      $scope.filteredLicenseList = data.licenseData.results.bindings.filter(function (l) {
        for (var token of tokens) {
          if (!l.title.value.toLowerCase().includes(token)) {
            return false;
          }
        }

        return true;
      });
    }

    $scope.filterLicenses("");

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
    $scope.formData.version.wasDerivedFrom = $scope.version.wasDerivedFrom;

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

    try {
      if ($scope.dataidCreator == null) {
        return;
      }
      var relativeUri = new URL($scope.version.uri).pathname;

      var response = await $http({
        method: 'GET',
        url: relativeUri,
        headers: {
          'Accept': 'application/ld+json',
          'X-Jsonld-Formatting': 'flatten'
        }
      });

      var graphs = response.data;
      var versionGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_VERSION);

      JsonldUtils.setLiteral(versionGraph, DatabusUris.DCT_TITLE, DatabusUris.XSD_STRING,
        $scope.formData.version.title);
      JsonldUtils.setLiteral(versionGraph, DatabusUris.DCT_ABSTRACT, DatabusUris.XSD_STRING,
        $scope.formData.version.abstract);
      JsonldUtils.setLiteral(versionGraph, DatabusUris.DCT_DESCRIPTION, DatabusUris.XSD_STRING,
        $scope.formData.version.description);
      JsonldUtils.setLink(versionGraph, DatabusUris.DCT_LICENSE, $scope.formData.version.license);
      JsonldUtils.setLiteral(versionGraph, DatabusUris.DATABUS_ATTRIBUTION, DatabusUris.XSD_STRING,
        $scope.formData.version.attribution);

      if ($scope.formData.version.wasDerivedFrom) {
        JsonldUtils.setLink(versionGraph, DatabusUris.PROV_WAS_DERIVED_FROM,
          $scope.formData.version.wasDerivedFrom);
      }

      var relativeUri = new URL($scope.version.uri).pathname;
      var response = await $http.put(relativeUri, graphs);

      if (response.status == 200) {
        $scope.version.title = $scope.formData.version.title;
        $scope.version.abstract = $scope.formData.version.abstract;
        $scope.version.description = $scope.formData.version.description;
        $scope.version.license = $scope.formData.version.license;
        $scope.version.attribution = $scope.formData.version.attribution;
        $scope.version.wasDerivedFrom = $scope.formData.version.wasDerivedFrom;

        DatabusAlert.alert($scope, true, "Version Saved!");
        $scope.$apply();
      }
    } catch (err) {
      DatabusAlert.alert($scope, false, "Failed to save version!");
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
  $scope.fileSelector.config.authenticated = $scope.authenticated;
  $scope.fileSelector.config.columns = [];
  $scope.fileSelector.config.columns.push({ field: 'variant', label: 'Variant', width: '45%' });
  $scope.fileSelector.config.columns.push({ field: 'format', label: 'Format', width: '15%' });
  $scope.fileSelector.config.columns.push({ field: 'compression', label: 'Compression', width: '15%' });

  $scope.artifactNode = new QueryNode($scope.version.artifact, 'databus:artifact');
  $scope.artifactNode.setFacet('http://purl.org/dc/terms/hasVersion', $scope.version.name, true);

  $scope.groupNode = new QueryNode(DatabusUtils.navigateUp($scope.version.artifact), 'databus:group');
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
    return DatabusUtils.uriToName(uri);
  }

  $scope.downloadMetadataAsFile = async function() {
    var response = await $http({
      method: 'GET',
      url: $scope.version.uri,
      headers: {
        'Accept': 'application/ld+json',
      }
    });

    $scope.download(`${$scope.version.name}.jsonld`, JSON.stringify(response.data, null, 3));
  }

  $scope.download = function(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }


}

module.exports = VersionPageController;