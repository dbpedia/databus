
// hinzufügen eines Controllers zum Modul
function CollectionEditorWidgetController(collectionManager, $scope) {

  var ctrl = this;
  ctrl.$scope = $scope;
  ctrl.collectionManager = collectionManager;

  ctrl.$onInit = function () {

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

    if (databusNode == undefined) {
      databusNode = new QueryNode(DATABUS_RESOURCE_BASE_URL, null);
      collection.content.root.childNodes.push(databusNode);
    }

    QueryNode.mergeAddChild(databusNode, selection);

    ctrl.collectionManager.activeCollection.hasLocalChanges
      = ctrl.collectionManager.hasLocalChanges(ctrl.collectionManager.activeCollection);
    ctrl.collectionManager.saveLocally();
  }

}


module.exports = CollectionEditorWidgetController;
