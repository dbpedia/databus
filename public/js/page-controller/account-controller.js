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
  var uriComponent = encodeURIComponent(`${DATABUS_RESOURCE_BASE_URL}/${$scope.profileData.accountName}`);

  $scope.dataSearchInput = '';
  $scope.dataSearchSettings = {
    minRelevance: 0.01,
    maxResults: 10,
    placeholder: `Search ${$scope.profileData.accountName}'s data...`,
    resourceTypes: ['Group', 'Artifact'],
    filter: `&publisher=${$scope.profileData.accountName}&typeNameWeight=0`
  };

  $scope.collectionSearchInput = '';
  $scope.collectionSearchSettings = {
    minRelevance: 0.01,
    maxResults: 10,
    placeholder: `Search ${$scope.profileData.accountName}'s collections...`,
    resourceTypes: ['Collection'],
    filter: `&publisher=${$scope.profileData.accountName}&publisherWeight=0&typeNameWeight=0`
  };

  // Wait for additional artifact data to arrive
  $scope.publishedData = {};
  $scope.publishedData.isLoading = true;

  $http.get(`/app/account/content?account=${encodeURIComponent($scope.profileData.accountName)}`)
    .then(function (response) {

      $scope.publishedData.groups = response.data.groups;
      $scope.publishedData.artifacts = response.data.artifacts;

      for (var artifact of $scope.publishedData.artifacts) {
        artifact.group = DatabusUtils.navigateUp(artifact.uri, 1);
        artifact.title = DatabusUtils.stringOrFallback(artifact.title, artifact.latestVersionTitle);
        artifact.abstract = DatabusUtils.stringOrFallback(artifact.abstract, artifact.latestVersionAbstract);
        artifact.description = DatabusUtils.stringOrFallback(artifact.description, artifact.latestVersionDescription);
      }

      for (var group of $scope.publishedData.groups) {
        group.artifacts = $scope.publishedData.artifacts.filter(function (a) {
          return a.group == group.uri;
        });
      }

      // Order by latest version date
      $scope.recentUploads = $scope.publishedData.artifacts.filter(function(v) {
        return v.latestVersionDate != null;
      });
      $scope.recentUploads.sort(function(a,b){
        return new Date(b.latestVersionDate) - new Date(a.latestVersionDate);
      });

      $scope.recentUploads = $scope.recentUploads.slice(0, 3);

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




  $scope.goToTab = function (value) {
    $location.hash(value);
  }



  $scope.$watch("location.hash()", function (newVal, oldVal) {

    if (newVal == 'settings') {
      $scope.tabViewModel.activeTab = 4;
    }

    if (newVal == 'collections') {
      $scope.tabViewModel.activeTab = 2;
    }

    if (newVal == 'data') {
      $scope.tabViewModel.activeTab = 1;
    }

    if (newVal == '') {
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

    for (var g in $scope.publishedData.groups) {
      var group = $scope.publishedData.groups[g];

      if (uri == group.uri) {
        return {
          type: 'Group',
          title: group.title,
          uri: uri,
          description: group.description
        }
      }

      for (var a in group.artifacts) {
        var artifact = group.artifacts[a];

        if (uri == artifact.artifactUri) {
          return {
            type: 'Artifact',
            title: artifact.title,
            uri: uri,
            description: artifact.description
          }
        }
      }
    }

    for (var c in $scope.collectionsData.collections) {
      var collection = $scope.collectionsData.collections[c];

      if (uri == collection.uri) {
        return {
          type: 'Collection',
          title: collection.title,
          uri: uri,
          description: collection.description
        }
      }
    }

  }

  $scope.refreshFeaturedContent = function () {
    if ($scope.profileData.featuredContent == undefined) {
      return;
    }

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