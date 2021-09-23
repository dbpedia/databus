

// hinzufügen eines Controllers zum Modul
function OverrideCheckboxController() {

  var ctrl = this;

  ctrl.$onInit = function() {

    if(ctrl.id == undefined) {
      ctrl.id = ctrl.label;
    }
  }

  ctrl.change = function() {

    if(!ctrl.readonly) {
      ctrl.onChange();
    }
  }
}

