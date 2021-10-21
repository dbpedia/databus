

// hinzufügen eines Controllers zum Modul
function CollectionEditorController($http, $location, $sce) {

  var ctrl = this;

  ctrl.activeTab = 0;
  ctrl.viewMode = -1;
  ctrl.$http = $http;

  ctrl.$onInit = function() {

    ctrl.viewMode = -1;

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
    ctrl.collection.files = ctrl.groupBy(ctrl.collection.files, 'dataset');

    ctrl.rootNode = {
      label : ctrl.collection.label,
      expanded : true
    };

    ctrl.generatedNode =  {
      label : "Generated Queries",
      expanded : ctrl.collection.content.groups.length > 0
    };

    ctrl.customNode =  {
      label : "Custom Queries",
      expanded : ctrl.collection.content.customQueries.length > 0
    };

    for(var g in ctrl.collection.content.groups) {
      ctrl.collection.content.groups[g].expanded = true;
    }
  }

  ctrl.groupBy = function(list, key) {
    var result = {};

    for(var i in list) {
      var element = list[i];
      var keyVal = element[key];

      if(result[keyVal] == undefined) {
        result[keyVal] = {}
        result[keyVal].value = keyVal;
        result[keyVal].label = element.label;
        result[keyVal].version = element.version;
        result[keyVal].downloads = [];
        result[keyVal].licenses = [];
      }

      result[keyVal].downloads.push(element);
    }
    
    return result;
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

  
  
  ctrl.showFiles = function() {
    ctrl.activeTab = 0;
    ctrl.isStatisticsLoading = false;
  }

  ctrl.showHierarchy = function() {
    ctrl.activeTab = 1;
    ctrl.isStatisticsLoading = false;
  }

  ctrl.showStatistics = function() {
    ctrl.activeTab = 2;
    ctrl.isStatisticsLoading = true;
    ctrl.loadStatisticsError = null;

    ctrl.$http.get('/system/api/collection-statistics', {
      params : { uri : ctrl.collection.uri } 
    }).then(function(result) {
      ctrl.isStatisticsLoading = false;
      ctrl.statistics = result.data;

      if(ctrl.statistics == null || ctrl.statistics == "") {
        ctrl.loadStatisticsError = "Failed to load collection statistics. Make sure the collection is published and try again.";
        return;
      }

      ctrl.statistics.licenses = ctrl.statistics.licenses.split(",");
    });
  }


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
    ctrl.activeNode = groupNode;
  }

  ctrl.showArtifactNode = function(artifactNode, groupNode) {
    ctrl.open = true;
    ctrl.viewMode = 1;
    ctrl.activeNode = artifactNode;
    ctrl.parentNode = groupNode;
  }

  ctrl.addCustomNode = function() {
    ctrl.collectionWrapper.addCustomQueryNode('Custom Query', 'SELECT * WHERE { ?s ?p ?o. }');
    ctrl.customNode.expanded = true;
  }

  ctrl.removeArtifactNode = function(groupNode, artifactNode) {

  }

  ctrl.showCustomQueryNode = function(customQueryNode) {
    ctrl.open = true;
    ctrl.viewMode = 2;
    ctrl.activeNode = customQueryNode;
  }
}
