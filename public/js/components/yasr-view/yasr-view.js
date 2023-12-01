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
      prefixes : {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        dct: 'http://purl.org/dc/terms/',
        dcat: 'http://www.w3.org/ns/dcat#',
        databus: 'https://dataid.dbpedia.org/databus#',
        sec: 'https://w3id.org/security#',
        cert: 'http://www.w3.org/ns/auth/cert#',
        foaf: 'http://xmlns.com/foaf/0.1/',
        dbo: 'http://dbpedia.org/ontology/',
        "databus-cv": 'https://dataid.dbpedia.org/databus-cv#'
      }

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
    var dataString = JSON.stringify(ctrl.data);
    if (ctrl.yasr != undefined && dataString != ctrl.currentDataString) {
      ctrl.yasr.setResponse(ctrl.data)
      ctrl.currentDataString = dataString;
    }


    /*
    setTimeout(function() {
      ctrl.yasqe.refresh();
    }, 10);*/
  }
}

module.exports = YasrViewController;