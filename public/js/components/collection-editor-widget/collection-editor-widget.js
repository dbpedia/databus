
// hinzufügen eines Controllers zum Modul
function CollectionEditorWidgetController(collectionManager, $scope) {

  var ctrl = this;
  ctrl.$scope = $scope;
  ctrl.collectionManager = collectionManager;

  ctrl.$onInit = function () {

  }

  ctrl.goToEditor = function () {
    window.location.href = '/app/collection-editor';
  }

  ctrl.addSelectionToCollection = function (uuid) {
    var selection = ctrl.selection;

    ctrl.collectionManager.setActive(uuid);
    var collection = ctrl.collectionManager.activeCollection;

    // Get local bus node
    var databusNode = QueryNode.findChildByUri(collection.content.root, DATABUS_RESOURCE_BASE_URL);

    if (databusNode != null) {
      QueryNode.mergeAddChild(databusNode, selection);

      ctrl.collectionManager.activeCollection.hasLocalChanges
        = ctrl.collectionManager.hasLocalChanges(ctrl.collectionManager.activeCollection);
      ctrl.collectionManager.saveLocally();
    }
  }

}


