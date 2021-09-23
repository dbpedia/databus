
// hinzufügen eines Controllers zum Modul
function CollectionStatisticsController($http, $scope, $location, $sce) {

  var ctrl = this;
  ctrl.$http = $http;


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
    var converter = window.markdownit();
    return $sce.trustAsHtml(converter.render(markdown));
  };

  ctrl.formatUploadSize = function(size) {
    return DatabusUtils.formatFileSize(size);
  };
}


