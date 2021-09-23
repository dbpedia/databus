// hinzufügen eines Controllers zum Modul
function MultiselectArtifactDropdownController($timeout, $sce) {

  var ctrl = this;
  ctrl.$sce = $sce;

  ctrl.$onInit = function () {
    ctrl.artifacts = ctrl.node.artifacts;
  }

  ctrl.handleKey = function (e) {
    if (e.which === 9 || e.which === 13) {
      ctrl.showDrop = false;
    }
  }

  ctrl.hasContent = function() {
    return node.artifacts.length > 0;
  }

  ctrl.hideDropDelayed = function () {
    $timeout(function () {
      ctrl.showDrop = false;
    }, 120);
  }

  ctrl.isChecked = function(value) {
    for(var c in ctrl.node.childNodes) {
      if(ctrl.node.childNodes[c].uri == value.artifactUri) {
        return true;
      }

    }

    return false;
  }

  ctrl.toggle = function (value) {

    var groupNode = QueryNode.createFrom(ctrl.node);
    var hasArtifact = QueryNode.findChildByUri(groupNode, value.artifactUri);
  
    if (!hasArtifact) {
      let node = new QueryNode(value.artifactUri, 'dataid:artifact');
      groupNode.addChild(node);
    } else {
      QueryNode.removeChildByUri(groupNode, value.artifactUri);
    }

    ctrl.change();
  }


  ctrl.change = function () {
    $timeout(function () {
      ctrl.onChange();
    }, 50);;
  }
}

