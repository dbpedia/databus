// hinzufügen eines Controllers zum Modul
function ExpandableArrowController() {

  var ctrl = this;

  ctrl.$onInit = function() {
    if(ctrl.isReadonly == undefined) {
      ctrl.isReadonly = false;
    }

    
  }

  ctrl.change = function() {

    if(!ctrl.isReadonly) {
      ctrl.expanded = !ctrl.expanded;
      ctrl.onChange();
    }
  }
}

module.exports = ExpandableArrowController;

