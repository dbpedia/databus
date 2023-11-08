function YasqeTextController($scope, $element) {

  var ctrl = this;

  ctrl.textField = $element.find('#custom-query');
  ctrl.$scope = $scope;

  ctrl.$onInit = function () {

    ctrl.yasqe = new Yasqe(ctrl.textField[0], {
      lineNumbers: true,
      viewportMargin: Infinity,
      readOnly: ctrl.readOnly,
      autorefresh: true
    });

    if (ctrl.autoSize) {
      var styleSheet = document.createElement("style")
      styleSheet.innerText = ".CodeMirror { height: auto !important; } .CodeMirror-vscrollbar { display: none !important; } .resizeWrapper { display: none !important; }";
      ctrl.textField[0].appendChild(styleSheet)
    }

    ctrl.yasqe.on('change', function () {
      ctrl.query = ctrl.yasqe.getValue();
      ctrl.valid = !ctrl.yasqe.queryValid;

      if (!$scope.$root.$$phase) {
        ctrl.$scope.$apply();
      }

      ctrl.onChange();
    });

    if (ctrl.query != undefined) {
      ctrl.yasqe.setValue(ctrl.query);
    }
  }

  ctrl.$doCheck = function () {
    if (ctrl.yasqe != undefined && ctrl.yasqe.getValue() != ctrl.query) {
      if (ctrl.query != undefined) {
        ctrl.yasqe.setValue(ctrl.query);
      }
    }

    setTimeout(function () {
      ctrl.yasqe.refresh();
    }, 10);

  }
}

module.exports = YasqeTextController;