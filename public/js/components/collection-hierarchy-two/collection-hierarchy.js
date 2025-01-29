const DatabusCollectionWrapper = require("../../collections/databus-collection-wrapper");
const QueryBuilder = require("../../query-builder/query-builder");
const QueryNode = require("../../query-builder/query-node");
const QueryTemplates = require("../../query-builder/query-templates");
const DatabusConstants = require("../../utils/databus-constants");
const DatabusFacetsCache = require("../../utils/databus-facets-cache");
const DatabusUris = require("../../utils/databus-uris");
const DatabusUtils = require("../../utils/databus-utils");
const DatabusWebappUtils = require("../../utils/databus-webapp-utils");

// hinzufügen eines Controllers zum Modul
function CollectionHierarchyControllerTwo($http, $location, $sce, $scope, collectionManager) {

  var ctrl = this;

  ctrl.viewMode = -1;
  ctrl.$http = $http;
  ctrl.$scope = $scope;
  ctrl.facets = new DatabusFacetsCache($http);
  ctrl.utils = new DatabusWebappUtils($scope, $sce);
  ctrl.$sce = $sce;

  collectionManager.onCollectionChangedInDifferentTab = function () {
    ctrl.previousCollectionId = null;
  }

  ctrl.defaultQuery = `PREFIX databus: <https://dataid.dbpedia.org/databus#>
PREFIX dcv:    <https://dataid.dbpedia.org/databus-cv#>
PREFIX dct:    <http://purl.org/dc/terms/>
PREFIX dcat:   <http://www.w3.org/ns/dcat#>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?file WHERE {
  # Replace this with your custom query:
  ?file <matches> <condition> .
} LIMIT 0`;
  const DATAID_ARTIFACT_PROPERTY = 'databus:artifact';
  const DATAID_GROUP_PROPERTY = 'databus:group';
  const KEY_LATEST_VERSION = "$latest";


  ctrl.$onInit = function () {

    ctrl.viewMode = -1;

    if (ctrl.collection == null) {
      return;
    }
  }

  ctrl.onAddContentClicked = function (sourceNode) {
    ctrl.onAddContent({ source: sourceNode.uri });

    ctrl.onChange();
    ctrl.updateViewModel();
  }


  ctrl.onAddCustomQueryClicked = function (sourceNode) {
    var node = QueryNode.createFrom(sourceNode);
    node.addChild(new QueryNode(DatabusUtils.uuidv4(), null));
    ctrl.onChange();
  }

  ctrl.toggleCollapsed = function (node, view) {
    view.collapsed = !view.collapsed;

    if (!view.collapsed) {
      ctrl.query(node);
    }
  }

  ctrl.isDatabus = async function (uri) {
    var req = {
      method: 'GET',
      url: uri,
      headers: {
        'Accept': 'application/rdf+turtle'
      }
    }

    var res = await ctrl.$http(req);
    var manifest = await DatabusUtils.parseDatabusManifest(res.data);
    var expectedUri = new URL(uri);

    if (manifest == undefined || manifest.uri != expectedUri.origin) {
      return false;
    }

    return true;
  }

  ctrl.getDatabusUri = async function (uri) {

    var url = new URL(uri);
    var segments = url.pathname.split('/');
    var base = url.origin;
    var currentUrl = base;

    var isDatabus = await ctrl.isDatabus(currentUrl);

    if (isDatabus) {
      return currentUrl;
    }

    for (var i = 0; segments.length; i++) {

      currentUrl += `/${segments[i]}`;
      var isDatabus = await ctrl.isDatabus(currentUrl);

      if (isDatabus) {
        return currentUrl;
      }
    }

  }

  ctrl.onAddResource = async function (uri) {

    if (uri.endsWith('/')) {
      uri = uri.substr(0, uri.length - 1);
    }

    let node = QueryNode.findChildByUri(ctrl.root, uri);

    // Resource already in collection
    if (node != undefined) {
      return;
    }

    var databusUri = await ctrl.getDatabusUri(uri);


    var databusUriLength = DatabusUtils.getResourcePathLength(databusUri);
    var resourceUriLength = DatabusUtils.getResourcePathLength(uri);
    var diff = resourceUriLength - databusUriLength;

    if (diff < 0 && diff > 3 || diff == 1) {
      return;
    }

    if (diff == 0) {
      ctrl.addDatabus(uri);
    }

    if (diff == 2) {
      ctrl.addDatabus(databusUri);
      let databusNode = QueryNode.findChildByUri(ctrl.root, databusUri);
      ctrl.addGroup(databusNode, uri);
    }

    if (diff == 3) {
      ctrl.addDatabus(databusUri);
      let databusNode = QueryNode.findChildByUri(ctrl.root, databusUri);
      let groupUri = DatabusUtils.navigateUp(uri);
      ctrl.addGroup(databusNode, groupUri);
      let groupNode = QueryNode.findChildByUri(ctrl.root, groupUri);
      ctrl.addArtifact(groupNode, uri);
    }

    ctrl.onChange();
    ctrl.updateViewModel();
    ctrl.$scope.$apply();
  }

  ctrl.addDatabus = function (uri) {
    let node = QueryNode.findChildByUri(ctrl.root, uri);

    if (node == null) {
      ctrl.root.childNodes.push(new QueryNode(uri, null));
    }
  }

  ctrl.addGroup = function (databusNode, uri) {
    let node = QueryNode.findChildByUri(ctrl.root, uri);

    if (node == null) {
      databusNode.childNodes.push(new QueryNode(uri, DATAID_GROUP_PROPERTY));
    }
  }

  ctrl.addArtifact = function (groupNode, uri) {
    let node = QueryNode.findChildByUri(ctrl.root, uri);

    if (node == null) {
      groupNode.childNodes.push(new QueryNode(uri, DATAID_ARTIFACT_PROPERTY));
    }
  }

  ctrl.addToCollection = function (source, view, result) {

    if (ctrl.isInCollection(result)) {
      QueryNode.removeChildByUri(ctrl.root, result.id[0].value);
    }
    else {
      if (result.typeName[0].value == 'Group') {
        let node = new QueryNode(result.id[0].value, DATAID_GROUP_PROPERTY);

        source.childNodes.push(node);
      }

      if (result.typeName[0].value == 'Artifact') {

        var artifactUri = result.id[0].value;
        let groupUri = DatabusUtils.navigateUp(artifactUri);
        let groupNode = QueryNode.findChildByUri(ctrl.root, groupUri);

        if (groupNode == null) {
          groupNode = new QueryNode(groupUri, DATAID_GROUP_PROPERTY);
          source.childNodes.push(groupNode);
        }

        let node = new QueryNode(artifactUri, DATAID_ARTIFACT_PROPERTY);
        groupNode.addChild(node);
      }
    }

    for (var res of view.searchResults) {
      res.inCollection = ctrl.isInCollection(res);
    }

    ctrl.onChange();
    ctrl.updateViewModel();
  }

  ctrl.isLastChild = function (group, artifact) {

    if (group.childNodes == undefined || group.childNodes.length == 0) {
      return false;
    }

    return group.childNodes[group.childNodes.length - 1].uri == artifact.uri;
  }

  ctrl.toggleExpand = function (node) {
    node.expanded = !node.expanded;
    ctrl.onChange();
  }

  ctrl.mergeFacets = function (node, facets) {

    if (node.facets == undefined) {
      node.facets = JSON.parse(JSON.stringify(facets));
      return;
    }

    for (var f in facets) {

      if (node.facets[f] == undefined) {
        node.facets[f] = JSON.parse(JSON.stringify(facets[f]));
        continue;
      }

      for (var value of facets[f].values) {
        if (!node.facets[f].values.includes(value)) {
          node.facets[f].values.push(value);
        }
      }
    }

    node.facetLabels = null;
  }

  ctrl.getAllFilters = function (groupNode, artifactNode) {

    if (artifactNode == null) {
      var result = Object.keys(groupNode.facetSettings)
      return DatabusUtils.uniqueList(result);
    }

    var result = Object.keys(groupNode.facetSettings).concat(Object.keys(artifactNode.facetSettings));
    return DatabusUtils.uniqueList(result);
  }

  ctrl.$doCheck = function () {

    if (ctrl.collection == null) {
      ctrl.previousCollectionId = null;
      return;
    }

    if (ctrl.previousCollectionId != ctrl.collection.uuid) {
      ctrl.previousCollectionId = ctrl.collection.uuid;

      ctrl.activeNode = null;
      ctrl.viewMode = -1;
      ctrl.updateViewModel();
    }
  }

  ctrl.handleKey = function (e, nodeView) {
    if (e.which === 9) {
      nodeView.showSearchResults = false;
    }
  }

  ctrl.isInCollection = function (result) {
    let uri = result.id[0].value;
    let node = QueryNode.findChildByUri(ctrl.root, uri);
    return node != null;
  }

  ctrl.updateSearchResults = function (view) {

    if (view == null || view.searchResults == null) {
      return;
    }

    for (var res of view.searchResults) {
      res.inCollection = ctrl.isInCollection(res);
    }
  }

  ctrl.searchNode = function (node, nodeView) {

    var baseUrl = new URL(node.uri).origin;
    var typeFilters = `typeName=Artifact Group`;

    if (node.property == DATAID_GROUP_PROPERTY) {
      var groupName = DatabusUtils.uriToResourceName(node.uri);
      var accountName = DatabusUtils.uriToResourceName(DatabusUtils.navigateUp(node.uri));
      typeFilters = `typeName=Artifact&publisher=${accountName}&group=${groupName}`;
    }

    var url = `${baseUrl}/api/search?${typeFilters}&typeNameWeight=0&format=JSON_FULL&minRelevance=15&maxResults=10&query=${nodeView.search}`;

    try {
      $http({ method: 'GET', url: url }).then(function successCallback(response) {

        nodeView.searchResults = [];

        for (var doc of response.data.docs) {
          doc.inCollection = ctrl.isInCollection(doc);
          nodeView.searchResults.push(doc);
        }

      }, function errorCallback(response) {
        console.log(response);
      });
    } catch (err) {

    }

  };

  ctrl.toggleExpand = function (view) {
    view.expanded = !view.expanded;
  }


  ctrl.isValidHttpUrl = function (url) {
    return DatabusUtils.isValidHttpUrl(url);
  }


  ctrl.updateViewModel = function () {
    ctrl.collectionWrapper = new DatabusCollectionWrapper(ctrl.collection);
    ctrl.root = ctrl.collection.content.root;

    ctrl.view = {};
    ctrl.view.groups = {};
    ctrl.view.artifacts = {};
    ctrl.view.sources = {};

    for (var s in ctrl.root.childNodes) {

      var sourceNode = ctrl.root.childNodes[s];

      if (ctrl.view.sources[sourceNode.uri] == undefined) {
        ctrl.view.sources[sourceNode.uri] = {};
        ctrl.view.sources[sourceNode.uri].uri = sourceNode.uri;
        ctrl.view.sources[sourceNode.uri].expanded = true;
        ctrl.view.sources[sourceNode.uri].addMode = 'artifact';
        ctrl.view.sources[sourceNode.uri].customQueryLabel = `New Custom Query`;
        ctrl.view.sources[sourceNode.uri].customQueryInput = ctrl.defaultQuery;
      }

      for (var g in sourceNode.childNodes) {

        var groupNode = sourceNode.childNodes[g];
        groupNode.expanded = true;


        ctrl.view.groups[groupNode.uri] = {};

        if (DatabusUtils.isValidHttpUrl(groupNode.uri)) {

          ctrl.facets.get(groupNode.uri).then(function (res) {
            delete res.facets[DatabusUris.DATABUS_ARTIFACT_PROPERTY];
            ctrl.view.groups[res.uri].facets = res.facets;

            var hasVersionFacets = ctrl.view.groups[res.uri].facets[DatabusUris.DCT_HAS_VERSION];

            if (hasVersionFacets != null && !hasVersionFacets.values.includes(KEY_LATEST_VERSION)) {
              hasVersionFacets.values.unshift(KEY_LATEST_VERSION);
            }

            $scope.$apply();
          });

          ctrl.query(groupNode);

          for (var a in groupNode.childNodes) {

            var artifactNode = groupNode.childNodes[a];

            ctrl.view.artifacts[artifactNode.uri] = {};
            ctrl.view.artifacts[artifactNode.uri].expanded = false;
            ctrl.view.artifacts[artifactNode.uri].collapsed = true;

            ctrl.facets.get(artifactNode.uri).then(function (res) {
              ctrl.view.artifacts[res.uri].facets = res.facets;

              var hasVersionFacets = ctrl.view.artifacts[res.uri].facets[DatabusUris.DCT_HAS_VERSION];

              if (hasVersionFacets != null && !hasVersionFacets.values.includes(KEY_LATEST_VERSION)) {
                hasVersionFacets.values.unshift(KEY_LATEST_VERSION);
              }

              $scope.$apply();
              //var groupUri = DatabusUtils.navigateUp(artifactNode.uri);
              //ctrl.view.artifacts[artifactNode.uri].facets = result.data;
              //ctrl.mergeFacets(ctrl.view.groups[groupUri], result.data);
            });



            /*en(function(result) {

               = result['http://purl.org/dc/terms/hasVersion'].values.unshift("$latest");


              var groupUri = DatabusUtils.navigateUp(artifactNode.uri);
              ctrl.view.artifacts[artifactNode.uri].facets = result.data;
              ctrl.mergeFacets(ctrl.view.groups[groupUri], result.data);

            });


          
            */
          }
        }
      }
    }
  }



  ctrl.onArtifactDropdownChanged = function (groupNode) {
    ctrl.onChange();
    ctrl.query(groupNode);
  }

  ctrl.selectAddFilterValue = function (viewNode, value) {
    viewNode.addFilterValueInput = value;
    viewNode.showValueDrop = false;

    ctrl.onAddFilterValueInputChanged(viewNode);
  }

  ctrl.selectAddFilterFacet = function (viewNode, value) {
    viewNode.addFilterFacetInput = value;
    viewNode.showFacetDrop = false;

    ctrl.onAddFilterFacetInputChanged(viewNode);
  }

  ctrl.onAddFilterValueInputChanged = function (viewNode) {

    for (var value of viewNode.facets[viewNode.addFilterFacet].values) {

      if (viewNode.addFilterValueInput == value) {
        viewNode.addFilterValue = value;
        return;
      }
    }

    viewNode.addFilterValue = null;
  }

  ctrl.onAddFilterFacetInputChanged = function (viewNode) {

    for (var facet in viewNode.facets) {

      if (viewNode.addFilterFacetInput == viewNode.facets[facet].label) {

        if (viewNode.addFilterFacet != facet) {
          viewNode.addFilterFacet = facet;
          viewNode.addFilterValue = [];
        }

        return;
      }
    }

    viewNode.addFilterFacet = null;
    viewNode.addFilterValue = [];
  }

  ctrl.includesValue = function (objs, value) {
    if (objs == undefined) {
      return false;
    }

    for (var obj of objs) {
      if (obj.value == value) {
        return true;
      }
    }

    return false;
  }

  ctrl.isLocalDatabusNode = function (node) {
    return node.uri == DATABUS_RESOURCE_BASE_URL;
  }
  ctrl.addFilter = function (node, facet, values, checked) {

    if (values == null) {
      return;
    }

    if (node.facetSettings[facet] == undefined) {
      node.facetSettings[facet] = [];
    }

    for (var value of values) {

      if (!ctrl.includesValue(node.facetSettings[facet], value.value)) {
        node.facetSettings[facet].push(value);
      }
    }

    ctrl.onChange();
    ctrl.query(node);
  }

  ctrl.query = function (node) {

    if (node.childNodes != undefined && node.childNodes.length > 0) {

      node.files = null;
      for (var child of node.childNodes) {
        ctrl.query(child);
      }

      return;
    }

    var queryNode = QueryNode.createSubTree(node);

    var fullQuery = QueryBuilder.build({
      node: queryNode,
      template: QueryTemplates.NODE_FILE_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL,
      root: ctrl.root
    });

    this.querySparql(fullQuery).then(function (result) {
      node.files = result;
      ctrl.$scope.$apply();

    });
  }

  ctrl.removeFilter = function (node, facet) {

    if (node.facetSettings[facet] == undefined) {
      return;
    }

    delete node.facetSettings[facet];

    ctrl.onChange();

    ctrl.query(node);
  }

  ctrl.onActiveFilterChanged = function (node) {
    ctrl.onChange();
    ctrl.query(node);
  }

  ctrl.getFacetLabels = function (viewNode) {

    if (viewNode.facetLabels != undefined) {
      return viewNode.facetLabels;
    }
    var result = [];

    for (var f in viewNode.facets) {
      result.push(viewNode.facets[f].label);
    }

    viewNode.facetLabels = result;
    return result;
  }


  ctrl.sortBy = function (property) {

    if (ctrl.sortProperty == property) {
      ctrl.sortReverse = !ctrl.sortReverse;
    }
    ctrl.sortProperty = property;
  }

  ctrl.formatFileSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };

  ctrl.toHTML = function (html) {
    return $sce.trustAsHtml(html);
  };

  ctrl.onComponentAdded = function () {

  }

  ctrl.customExpanded = function () {
    return ctrl.customNode.expanded && ctrl.collection.content.customQueries.length > 0;
  }

  ctrl.generatedExpanded = function () {
    return ctrl.generatedNode.expanded && ctrl.collection.content.groups.length > 0;
  }

  ctrl.publishCollection = function () {
    ctrl.onPublish();
  }

  ctrl.delete = function () {
    ctrl.onDelete();
  }

  ctrl.goToResource = function (node) {
    window.location = node.uri;
  }

  ctrl.formatGroupPrefix = function (uri) {
    return DatabusUtils.uriToName(DatabusUtils.navigateUp(uri));
  }

  ctrl.formatArtifactPrefix = function (uri) {
    var nav = DatabusUtils.navigateUp(uri);
    var groupName = DatabusUtils.uriToName(nav);
    var userName = DatabusUtils.uriToName(DatabusUtils.navigateUp(nav));

    return userName + '/' + groupName;
  }

  ctrl.uriToName = function (uri) {
    return DatabusUtils.uriToName(uri);
  }

  ctrl.objSize = function (obj) {
    return DatabusUtils.objSize(obj);
  }

  ctrl.showCollectionSearch = function () {
    ctrl.open = false;
    ctrl.viewMode = 0;
    ctrl.activeNode = ctrl.rootNode;

    $location.hash('search');
  }

  // ctrl.printJSON = function() {
  //   console.log(JSON.stringify(ctrl.collection));
  // }

  // SHOW NODES
  ctrl.showGroupNode = function (groupNode) {
    ctrl.open = true;
    ctrl.viewMode = 3;
    ctrl.activeNode = QueryNode.createFrom(groupNode);

    this.updateQuery();
  }

  ctrl.showArtifactNode = function (artifactNode, groupNode) {

    ctrl.open = true;
    ctrl.viewMode = 1;
    ctrl.activeNode = QueryNode.createFrom(artifactNode);

    this.updateQuery();
  }

  ctrl.querySparql = async function (query) {


    try {

      var req = {
        method: 'POST',
        url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
        data: "format=json&query=" + encodeURIComponent(query),
        headers: {
          "Content-type": "application/x-www-form-urlencoded"
        },
      }

      var updateResponse = await ctrl.$http(req);

      var data = updateResponse.data;
      var bindings = data.results.bindings;

      for (var b in bindings) {
        ctrl.reduceBinding(bindings[b]);
      }

      return bindings;


    } catch (e) {
      console.log(e);
    }
  }

  ctrl.reduceBinding = function (binding) {
    for (var key in binding) {
      binding[key] = binding[key].value;
    }

    return binding;
  }



  ctrl.updateQuery = function () {
    var queryNode = QueryNode.createSubTree(ctrl.activeNode);

    ctrl.activeFileQuery = QueryBuilder.build({
      node: queryNode,
      template: QueryTemplates.DEFAULT_FILE_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });

    ctrl.activeFullQuery = QueryBuilder.build({
      node: queryNode,
      template: QueryTemplates.NODE_FILE_TEMPLATE,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL
    });
  }

  ctrl.onActiveNodeChanged = function () {
    this.updateQuery();

    ctrl.onChange();
  }

  ctrl.addCustomNode = function (sourceNode, label, desc, query) {

    var node = new QueryNode(label, query);
    sourceNode.childNodes.push(node);


    ctrl.updateViewModel();
    ctrl.onChange();
  }

  ctrl.removeNode = function (node) {

    var parent = ctrl.collectionWrapper.getParentNode(node);
    ctrl.collectionWrapper.removeNodeByUri(node.uri);

    if (parent != null) {
      ctrl.query(parent);
    }

    ctrl.onChange();
  }

  ctrl.showCustomQueryNode = function (customQueryNode) {
    ctrl.open = true;
    ctrl.viewMode = 2;
    ctrl.activeNode = customQueryNode;
  }

  ctrl.list = function (setting) {

    var allEntries = Object.keys(setting).map(function (key, index) {

      var label = undefined;
      var entry = setting[key];

      if (entry.value == '') {
        label = '<i style="color: #a3a3a3;">None</i>';
      } else if (entry.value == '$latest') {
        label = 'Latest Version';
      } else {
        label = entry.value;
      }

      if (entry.checked) {
        return label;
      } else {
        return `<s>${label}</s>`;
      }
    });


    var list = [];
    var maxLength = 50;
    var length = 0;
    var hasOverflow = false;

    for (var entry of allEntries) {
      if (entry.length + length > maxLength) {
        hasOverflow = true;
        break;
      }

      length += entry.length;
      list.push(entry);
    }

    if (hasOverflow) {
      list.push('...');
    }

    return ctrl.$sce.trustAsHtml(list.join(', '));
    // return setting.map(function (v) { return v.value }).join(', ');
  }
}


module.exports = CollectionHierarchyControllerTwo;