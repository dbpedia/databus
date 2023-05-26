// TODO fabian bug

// hinzufügen eines Controllers zum Modul
function CollectionHierarchyController($http, $location, $sce) {

  var ctrl = this;

  ctrl.viewMode = -1;
  ctrl.$http = $http;

  ctrl.artifactTableConfig = {};
  ctrl.artifactTableConfig.columns = [];
  ctrl.artifactTableConfig.columns.push({ field : 'version', label : 'Version', width: '25%' });
  ctrl.artifactTableConfig.columns.push({ field : 'variant', label : 'Variant', width: '25%' });
  ctrl.artifactTableConfig.columns.push({ field : 'format', label : 'Format', width: '10%' });
  ctrl.artifactTableConfig.columns.push({ field : 'compression', label : 'Compression', width: '15%' });

  ctrl.groupTableConfig = {};
  ctrl.groupTableConfig.columns = [];
  ctrl.groupTableConfig.columns.push({ field : 'artifact', label : 'Artifact',  width: '35%', uriToName: true });
  ctrl.groupTableConfig.columns.push({ field : 'version', label : 'Version', width: '17%' });
  ctrl.groupTableConfig.columns.push({ field : 'variant', label : 'Variant', width: '17%' });
  ctrl.groupTableConfig.columns.push({ field : 'format', label : 'Format', width: '8%' });

  ctrl.$onInit = function() {

    ctrl.viewMode = -1;
    ctrl.queryBuilder = new QueryBuilder();

    if(ctrl.collection == null) {
      return;
    }

    ctrl.updateViewModel();
  }

  ctrl.$doCheck = function() {

    if(ctrl.collection == null) {
      ctrl.previousCollectionId = null;
      return;
    }

    if(ctrl.previousCollectionId != ctrl.collection.uuid) {
      ctrl.previousCollectionId = ctrl.collection.uuid;

      ctrl.activeNode = null;
      ctrl.viewMode = -1;
      ctrl.updateViewModel();
    }
  }

  ctrl.updateViewModel = function() {
    ctrl.collectionWrapper = new DatabusCollectionWrapper(ctrl.collection);

    ctrl.rootNode = {
      label : ctrl.collection.label,
      expanded : true
    };

    ctrl.generatedNode =  {
      label : "Add Groups and Artifacts by Search",
      expanded : ctrl.collection.content.groups.length > 0
    };

    ctrl.customNode =  {
      label : "Custom Queries",
      expanded : ctrl.collection.content.customQueries.length > 0
    };

    for(var g in ctrl.collection.content.root.childNodes) {
      ctrl.collection.content.root.childNodes[g].expanded = true;
    }
  }

 

  ctrl.sortBy = function(property) {

    if(ctrl.sortProperty == property) {
      ctrl.sortReverse = !ctrl.sortReverse;
    }
    ctrl.sortProperty = property;
  }

  ctrl.formatUploadSize = function(size) {
    return Math.round(size * 100) / 100;
  };

  ctrl.toHTML = function(html) {
    return $sce.trustAsHtml(html);
  };

  ctrl.onComponentAdded = function () {
    ctrl.generatedNode.expanded = true;
  }

  ctrl.customExpanded = function () {
    return ctrl.customNode.expanded && ctrl.collection.content.customQueries.length > 0;
  }

  ctrl.generatedExpanded = function() {
    return ctrl.generatedNode.expanded && ctrl.collection.content.groups.length > 0;
  }

  ctrl.publishCollection = function() {
    ctrl.onPublish();
  }

  ctrl.delete = function() {
    ctrl.onDelete();
  }

  ctrl.goToResource = function(node) {
    window.location = node.uri;
  }

  ctrl.formatGroupPrefix = function(uri) {
    return DatabusUtils.uriToName(DatabusUtils.navigateUp(uri));
  }

  ctrl.formatArtifactPrefix = function(uri) {
    var nav = DatabusUtils.navigateUp(uri);
    var groupName = DatabusUtils.uriToName(nav);
    var userName = DatabusUtils.uriToName(DatabusUtils.navigateUp(nav));

    return userName + '/' + groupName;
  }

  ctrl.uriToName = function(uri) {
    return DatabusUtils.uriToName(uri);
  }

  ctrl.showCollectionSearch = function() {
    ctrl.open = false;
    ctrl.viewMode = 0;
    ctrl.activeNode = ctrl.rootNode;

    $location.hash('search');
  }

  // ctrl.printJSON = function() {
  //   console.log(JSON.stringify(ctrl.collection));
  // }

  // SHOW NODES
  ctrl.showGroupNode = function(groupNode) {
    ctrl.open = true;
    ctrl.viewMode = 3;
    ctrl.activeNode = QueryNode.createFrom(groupNode);

    this.updateQuery();
  }

  ctrl.showArtifactNode = function(artifactNode, groupNode) {
    
    ctrl.open = true;
    ctrl.viewMode = 1;
    ctrl.activeNode = QueryNode.createFrom(artifactNode);

    this.updateQuery();
  }

  ctrl.updateQuery = function() {
    var queryNode = QueryNode.createSubTree(ctrl.activeNode);
    ctrl.activeFileQuery = ctrl.queryBuilder.createFileQuery(queryNode);
    ctrl.activeFullQuery = ctrl.queryBuilder.createFullQuery(queryNode);
  }

  ctrl.onActiveNodeChanged = function() {
    this.updateQuery();

    ctrl.onChange();
  }

  ctrl.addCustomNode = function() {
    ctrl.collectionWrapper.addCustomQueryNode('Custom Query', 'PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n\
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
    ctrl.customNode.expanded = true;

    ctrl.onChange();
  }

  ctrl.removeNode = function(node) {
    ctrl.collectionWrapper.removeNodeByUri(node.uri);
    ctrl.onChange();
  }

  ctrl.showCustomQueryNode = function(customQueryNode) {
    ctrl.open = true;
    ctrl.viewMode = 2;
    ctrl.activeNode = customQueryNode;
  }
}

