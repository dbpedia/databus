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
function FrontPageController($scope, $sce) {

  $scope.activityChartData = data.activityData;
  $scope.recentUploadsData = data.recentUploadsData;
  $scope.uploadRankingData = data.rankingData;


  $scope.auth = data.auth;

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
