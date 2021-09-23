

// hinzufügen eines Controllers zum Modul
function EditLabelController($element) {

  var ctrl = this;
  var cachedContent = null;

  ctrl.$onInit = function() {
    ctrl.isEdit = false;
    cachedContent = null;
    //ctrl.autoExpand('textarea');
  }

  ctrl.edit = function() {
    ctrl.isEdit = true;
  }

  ctrl.$doCheck = function() {
    if(cachedContent != ctrl.text) {
      ctrl.onChange();
      cachedContent = ctrl.text;
    }
  }
}

