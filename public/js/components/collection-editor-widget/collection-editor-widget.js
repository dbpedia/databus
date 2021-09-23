
// hinzufügen eines Controllers zum Modul
function CollectionEditorWidgetController(collectionManager, $scope) {

  var ctrl = this;
  ctrl.$scope = $scope;
  ctrl.collectionManager = collectionManager;

  ctrl.$onInit = function() {

  }

  ctrl.goToEditor = function() {
    window.location.href = '/system/collection-editor';
  }

  ctrl.addSelectionToCollection = function() {
    var selection = ctrl.selection;
    QueryNode.mergeAddChild(ctrl.collection.content.generatedQuery.root, selection);

    ctrl.collectionManager.activeCollection.hasLocalChanges 
      = ctrl.collectionManager.hasLocalChanges(ctrl.collectionManager.activeCollection);
    ctrl.collectionManager.saveLocally();
  }
  
}


