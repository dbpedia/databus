const DatabusCollectionUtils = require("../../collections/databus-collection-utils");
const DatabusUtils = require("../../utils/databus-utils");
const DatabusWebappUtils = require("../../utils/databus-webapp-utils");

// hinzufügen eines Controllers zum Modul
function CollectionStatisticsController($http, $scope, $location, $sce) {

  var ctrl = this;
  ctrl.$http = $http;
  ctrl.utils = new DatabusWebappUtils($scope, $sce);


  ctrl.$onInit = function() {
    ctrl.isLoading = true;
    DatabusCollectionUtils.getCollectionStatistics(ctrl.$http, ctrl.collection).then(function(result) {
      ctrl.statistics = result;
      ctrl.isLoading = false;
      $scope.$apply();
    }, function(err) {
      ctrl.statistics = null;
      ctrl.isLoading = false;
    });
  }

  ctrl.markdownToHtml = function(markdown) {
    return ctrl.utils.markdownToHtml(markdown);
  };

  ctrl.formatUploadSize = function(size) {
    return DatabusUtils.formatFileSize(size);
  };
}

module.exports = CollectionStatisticsController;

