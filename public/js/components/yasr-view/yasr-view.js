function YasrViewController($scope, $element) {

  var ctrl = this;

  ctrl.textField = $element.find('#custom-query');
  ctrl.$scope = $scope;

  ctrl.$onInit = function () {


    ctrl.yasr = new Yasr(ctrl.textField[0], {
      //lineNumbers: true,
      //viewportMargin: Infinity,
      //readOnly: ctrl.readOnly,
      //autorefresh: true
      persistencyExpire : 0.1

    });



    /*
    if(ctrl.autoSize) {

     var styleSheet = document.createElement("style")
     styleSheet.innerText = ".CodeMirror { height: auto !important; } .CodeMirror-vscrollbar { display: none !important; } .resizeWrapper { display: none !important; }";
     ctrl.textField[0].appendChild(styleSheet)
    }

    ctrl.yasr.on('change', function() {
      ctrl.query = ctrl.yasqe.getValue();
      ctrl.valid = !ctrl.yasqe.queryValid;

      if(!$scope.$root.$$phase) {
        ctrl.$scope.$apply();
      }

      ctrl.onChange();
    });

   ctrl.yasqe.setValue(ctrl.query);*/
  }


  ctrl.$doCheck = function () {
    if (ctrl.yasr != undefined && ctrl.data != undefined) {
      ctrl.yasr.setResponse(ctrl.data)
    }


    /*
    setTimeout(function() {
      ctrl.yasqe.refresh();
    }, 10);*/
  }
}

module.exports = YasrViewController;