const DatabusUtils = require("../../utils/databus-utils");

// hinzufügen eines Controllers zum Modul
function EntityCardController($sce) {

  var ctrl = this;

  ctrl.$onInit = function() {

    if(ctrl.label == null || ctrl.label == "") {
      ctrl.label = DatabusUtils.uriToTitle(ctrl.uri);
    }
  }

  ctrl.formatResult = function(result) {
    return $sce.trustAsHtml(result);
  }
}


module.exports = EntityCardController;