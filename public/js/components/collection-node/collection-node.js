// TODO Fabian evtl bug

// hinzufügen eines Controllers zum Modul
function CollectionNodeController() {

  var ctrl = this;

  ctrl.$onInit = function() {

  }

  ctrl.removeNode = function() {
    ctrl.onRemoveNode();
  }

  ctrl.click = function() {
    ctrl.onClick();
  }
}

module.exports = CollectionNodeController;