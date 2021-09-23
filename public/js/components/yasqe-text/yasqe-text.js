function YasqeTextController($scope, $element) {

  var ctrl = this;

  ctrl.textField = $element.find('textarea');
  ctrl.$scope = $scope;

  ctrl.$onInit = function() {
    ctrl.yasqe = YASQE.fromTextArea(ctrl.textField[0], {
       lineNumbers: true,
       viewportMargin: Infinity,
       readOnly: ctrl.readOnly,
       autorefresh: true
     });

     ctrl.yasqe.on('change', function() {
       ctrl.query = ctrl.yasqe.getValue();
       ctrl.valid = !ctrl.yasqe.queryValid;

       if(!$scope.$root.$$phase) {
         ctrl.$scope.$apply();
       }

       ctrl.onChange();
     });

    ctrl.yasqe.setValue(ctrl.query);
  }

  ctrl.$doCheck = function() {
    if(ctrl.yasqe != undefined && ctrl.yasqe.getValue() != ctrl.query) {
      ctrl.yasqe.setValue(ctrl.query)
    }

    setTimeout(function() {
      ctrl.yasqe.refresh();
    }, 10);

  }
}
