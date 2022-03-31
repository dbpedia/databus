var DEFAULT_IMAGE = "https://picsum.photos/id/223/320/320";

// Controller for the header section
function AccountPageController($scope, $http, $location) {



  // Pick up the profile data
  $scope.profileData = data.profile;
  $scope.auth = data.auth;
  $scope.location = $location;

  // Exit if there is no profile
  if ($scope.profileData == undefined) {
    return;
  }

  // Initialize the user-internal search
  $scope.searchInput = '';
  $scope.searchFilters = [
    'publisherUri=' + encodeURIComponent(`${DATABUS_RESOURCE_BASE_URL}/${$scope.profileData.accountName}`),
    'minRelevance=0.1'
  ];

  // Wait for additional artifact data to arrive
  $scope.artifactData = {};
  $scope.artifactData.isLoading = true;

  $http.get(`/app/account/artifacts?account=${encodeURIComponent($scope.profileData.accountName)}`)
    .then(function (response) {
      $scope.artifactData.groups = response.data;
      $scope.artifactData.isLoading = false;

      var artifacts = [];

      for (var g in $scope.artifactData.groups) {
        var group = $scope.artifactData.groups[g];
        for (var a in group.artifacts) {
          var artifact = group.artifacts[a];
          artifacts.push($scope.artifactData.groups[g].artifacts[a]);

          if (group.lastUpdateDate == undefined || group.lastUpdateDate < artifact.date) {
            group.lastUpdateDate = artifact.date;
          }
        }
      }

      artifacts.sort((a, b) => a.date > b.date ? -1 : 1);
      $scope.recentUploads = artifacts.slice(0, 3);

      $scope.refreshFeaturedContent();
    }, function (err) {
      console.log(err);
    });


  // Wait for stats data to arrive
  $scope.statsData = {};
  $scope.statsData.isLoading = true;

  $http.get(`/app/account/stats?account=${encodeURIComponent($scope.profileData.accountName)}`).then(function (response) {
    $scope.statsData.stats = response.data;
    $scope.statsData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  // Wait for activity chart data to arrive
  $scope.activityData = {};
  $scope.activityData.isLoading = true;

  $http.get(`/app/account/activity?account=${encodeURIComponent($scope.profileData.accountName)}`).then(function (response) {
    $scope.activityData.entries = response.data;
    $scope.activityData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  $scope.collectionsData = {};
  $scope.collectionsData.isLoading = true;

  $http.get(`/app/account/collections?account=${encodeURIComponent($scope.profileData.accountName)}`)
    .then(function (response) {

      $scope.collectionsData.collections = response.data;
      $scope.collectionsData.isLoading = false;
      $scope.refreshFeaturedContent();
    }, function (err) {
      console.log(err);
    });

  $scope.getImageUrl = function () {
    if ($scope.profileData.imageUrl == undefined) {
      return DEFAULT_IMAGE;
    } else {
      return $scope.profileData.imageUrl;
    }
  }

  $scope.uriToName = function (uri) { return DatabusUtils.uriToName(uri); }

  $scope.formatDateFromNow = function (date) {
    return moment(date).fromNow();
  };

  $scope.formatCollectionDateFromNow = function (longString) {
    var number = new Number(longString);
    var dateTime = new Date(number);
    return moment(dateTime).fromNow();
  };

  $scope.formatDate = function (date) {
    return moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
  };

  // We have profile data in $scope.profileData!
  $scope.profileData.isOwn = $scope.auth.authenticated && $scope.auth.info.accountName == $scope.profileData.accountName;

  $scope.tabViewModel = {};
  $scope.tabViewModel.activeTab = 0;
  $scope.tabViewModel.tabs = []
  $scope.tabViewModel.tabs.length = 4;


 

  $scope.goToTab = function(value) {
    $location.hash(value);
  }



  $scope.$watch("location.hash()", function(newVal, oldVal) {

    if(newVal == 'settings') {
      $scope.tabViewModel.activeTab = 4;
    }
  
    if(newVal == 'collections') {
      $scope.tabViewModel.activeTab = 2;
    }

    if(newVal == 'data') {
      $scope.tabViewModel.activeTab = 1;
    }

    if(newVal == '') {
      $scope.tabViewModel.activeTab = 0;
    }
    
  }, true);

  var tabKeys = ['', 'data', 'collections', 'profile'];

  for (var i = 0; i < tabKeys.length; i++) {
    $scope.tabViewModel.tabs[i] = {};
    $scope.tabViewModel.tabs[i].key = tabKeys[i];
    $scope.tabViewModel.tabs[i].data = [];
  }

  $scope.findFeaturedContent = function (uri) {

    for (var g in $scope.artifactData.groups) {
      var group = $scope.artifactData.groups[g];

      if (uri == group.uri) {
        return {
          type: 'Group',
          label: group.label,
          uri: uri,
          abstract: group.abstract
        }
      }

      for (var a in group.artifacts) {
        var artifact = group.artifacts[a];

        if (uri == artifact.artifactUri) {
          return {
            type: 'Artifact',
            label: artifact.label,
            uri: uri,
            abstract: artifact.abstract
          }
        }
      }
    }

    for (var c in $scope.collectionsData.collections) {
      var collection = $scope.collectionsData.collections[c];

      if (uri == collection.uri) {
        return {
          type: 'Collection',
          label: collection.label,
          uri: uri,
          abstract: collection.abstract
        }
      }
    }

  }

  $scope.refreshFeaturedContent = function () {
    var featuredContentUris = $scope.profileData.featuredContent.split('\n');
    $scope.featuredContent = [];

    for (var f in featuredContentUris) {
      var content = $scope.findFeaturedContent(featuredContentUris[f]);

      if (content != undefined) {
        $scope.featuredContent.push(content);
      }
    }
  }

  $scope.formatUploadSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };


}