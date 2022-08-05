/**
 * Controller of the front page
 * @param  {scope} $scope      [description]
 * @param  {http} $http       [description]
 * @param  {sce} $sce        [description]
 * @param  {factory} auth        [description]
 * @param  {factory} collections [description]
 * @param  {factory} sparql      [description]
 * @return {[type]}             [description]
 */
function FrontPageController($scope, $sce, $http) {

  $scope.databusName = DATABUS_NAME;

  $scope.auth = data.auth;

  $scope.activityChartData = {};
  $scope.activityChartData.isLoading = true;

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


  $scope.formatUploadSize = function(size) {
    return Math.round(size * 100) / 100;
  };

  for(var d in $scope.uploadRankingData) {
    $scope.uploadRankingData[d].uploadSize = $scope.formatUploadSize($scope.uploadRankingData[d].uploadSize);
  }

  $scope.formatDate = function(date) {
    return moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
  };

  $scope.formatLicense = function(licenseUri) {
    var licenseName = DatabusUtils.uriToName(licenseUri);

    var html = '<div class="license-icon is-primary">' + licenseName + '</div>'
    return $sce.trustAsHtml(html);
  }

  for(var d in $scope.recentUploadsData) {
    $scope.recentUploadsData[d].date = $scope.formatDate($scope.recentUploadsData[d].date);
    $scope.recentUploadsData[d].licenseTag = $scope.formatLicense($scope.recentUploadsData[d].license);
  }
}
