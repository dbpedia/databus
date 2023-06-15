// hinzufügen eines Controllers zum Modul
function EntityCardController($sce) {

  var ctrl = this;

  ctrl.$onInit = function() {

    //if(ctrl.desc != null && ctrl.desc.length > 300) {
    //  ctrl.desc = ctrl.desc.substr(0, 300) + '...';
    //}
  }

  ctrl.formatResult = function(result) {
    return $sce.trustAsHtml(result);
  }
}


module.exports = EntityCardController;