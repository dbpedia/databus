

// hinzufügen eines Controllers zum Modul
function CollectionStatusController($http, $location, $sce) {

  var ctrl = this;

  ctrl.$onInit = function() {

    ctrl.colors = [];
    ctrl.colors.push('#b54c4c');
    ctrl.colors.push('#aaa');
    ctrl.colors.push('#aaa');
    ctrl.colors.push('#e8ca5f');
    ctrl.colors.push('#3a3');

    ctrl.labels = [];
    ctrl.labels.push('Draft');
    ctrl.labels.push('Hidden, Uncommitted Changes');
    ctrl.labels.push('Hidden');
    ctrl.labels.push('Visible, Uncommitted Changes');
    ctrl.labels.push('Visible');
  }

  ctrl.$doCheck = function() {
    if(ctrl.isDraft) {
      ctrl.status = 0;
      return;
    }

    if(ctrl.isPublished) {
      ctrl.status = ctrl.hasLocalChanges ? 3 : 4;
    } else {
      ctrl.status = ctrl.hasLocalChanges ? 1 : 2;
    }
  }
}

module.exports = CollectionStatusController;
