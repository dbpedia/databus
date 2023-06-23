// hinzufügen eines Controllers zum Modul
function AutofillDropdownController($timeout) {

  var ctrl = this;

  ctrl.$onInit = function () {
    ctrl.displayValues = [];
  }

  ctrl.showAll = function() {
    ctrl.showDrop = true;
    ctrl.displayValues = ctrl.values;
  }

  ctrl.handleKey = function (e) {

    if (e.which === 9 || e.which === 13) {

      ctrl.showDrop = false;

      if(ctrl.displayValues.length > 0 && ctrl.input != ctrl.displayValues[0]) {
        e.preventDefault();
        ctrl.input = ctrl.displayValues[0];
        ctrl.change();
      }
    }
  }

  ctrl.hideDropDelayed = function () {
    $timeout(function () {
      ctrl.showDrop = false;
    }, 120);
  }

  ctrl.autoComplete = function () {

    ctrl.showDrop = true;
    if (ctrl.input == "" || ctrl.input == undefined) {
      ctrl.displayValues = ctrl.values;
      return;
    }

    ctrl.displayValues = [];

    for (var value of ctrl.values) {
      if (value.includes(ctrl.input) && value != ctrl.input) {
        ctrl.displayValues.push(value);
      }
    }

    if(ctrl.displayValues.length == 0) {
      ctrl.showDrop = false;
    }
  }

  ctrl.change = function () {

    ctrl.autoComplete();

    $timeout(function () {
      ctrl.onChange();
    }, 50);;
  }
}

module.exports = AutofillDropdownController;

