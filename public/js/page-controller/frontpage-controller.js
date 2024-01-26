const DatabusUris = require("../utils/databus-uris");
const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");

/**
 * Controller of the front page
 * @param  {scope} $scope      [description]
 * @param  {http} $http       [description]
 * @param  {sce} $sce        [description]
 */
function FrontPageController($scope, $sce, $http) {

  $scope.databusName = DATABUS_NAME;

  $scope.auth = data.auth;

  $scope.activityChartData = {};
  $scope.activityChartData.isLoading = true;
  $scope.utils = new DatabusWebappUtils();

  $scope.searchQuery = "";
  $scope.searchSettings = {
    minRelevance: 20,
    maxResults: 25,
    placeholder: `Search the Databus...`,
    resourceTypes: undefined,
    filter: `&typeNameWeight=0`
  };

  $http.get(`/app/index/activity`).then(function (response) {
    $scope.activityChartData.entries = response.data;
    $scope.activityChartData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  $scope.uploadRankingData = {};
  $scope.uploadRankingData.isLoading = true;

  $http.get(`/app/index/ranking`).then(function (response) {
    $scope.uploadRankingData.data = response.data;
    $scope.uploadRankingData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  $scope.recentUploadsData = {};
  $scope.recentUploadsData.isLoading = true;

  $http.get(`/app/index/recent`).then(function (response) {
    $scope.recentUploadsData.data = response.data;
    $scope.recentUploadsData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

   // Login function
   $scope.login = function () {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.goToPage = function(path) {
    window.location = path;
  }

  $scope.account = function() {
    window.location = '/app/account';
  }

  for(var d in $scope.uploadRankingData) {
    $scope.uploadRankingData[d].uploadSize = DatabusUtils.formatFileSize($scope.uploadRankingData[d].uploadSize);
  }

  for(var d in $scope.recentUploadsData) {
    $scope.recentUploadsData[d].date = DatabusUtils.formatDate($scope.recentUploadsData[d].date);
  }
}


module.exports = FrontPageController;
