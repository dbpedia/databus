
// hinzufügen eines Controllers zum Modul
function BetterDropdownController($scope, $timeout, $element) {


  const ctrl = this;
  ctrl.isActive = false;

  ctrl.closeAll = function() {
    ctrl.rootNode.isActive = false;
    ctrl.setChildrenActiveState(ctrl.rootNode, false);
  }

  ctrl.activateNode = function(parent, node) {
    for(var sibling of parent.children) {
      sibling.isActive = false;
      ctrl.setChildrenActiveState(sibling, false);
    }

    node.isActive = true;
  }

  ctrl.setChildrenActiveState = function(node, value) {
    if(node.children == null) {
      return;
    }

    for(var child of node.children) {
      child.isActive = value;
      ctrl.setChildrenActiveState(child, value);
    }
  }

  ctrl.toggleNode = function(node) {
    node.isActive = !node.isActive;

    if(!node.isActive) {
      ctrl.setChildrenActiveState(node, false);
    }
  }

  ctrl.toggleDropdown = function () {
    ctrl.isActive = !ctrl.isActive;
  };
  ctrl.showDropdown = function () {
    ctrl.isActive = true;
  };
  ctrl.hideDropdown = function () {
    ctrl.isActive = false;
  };

  ctrl.showNested = function (parent, node) {
    if (node.children) {
      ctrl.cancelShowNested();
      ctrl.currentTimeout = $timeout(function () {
        ctrl.activateNode(parent, node);
      }, 200);
    }
  };

  ctrl.cancelShowNested = function() {
    if(ctrl.currentTimeout != null) {
      $timeout.cancel(ctrl.currentTimeout);
      ctrl.currentTimeout = null;
    }
  }

  ctrl.toggleNestedDropdown = function (node) {
    node.showChildren = !node.showChildren;
  };
  ctrl.selectNode = function (node) {
    // Handle the selected node here
    ctrl.onNodeClicked({ node : node });
  };



}


module.exports = BetterDropdownController;
