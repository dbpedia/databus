

// hinzufügen eines Controllers zum Modul
function SearchController($http, $interval, $sce) {

  var ctrl = this;

  ctrl.results = [];

  ctrl.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  ctrl.toggleFilter = function(key) {
    ctrl.filters[key] = !ctrl.filters[key];
    ctrl.search();
  }

  ctrl.searchInput = '';
  ctrl.filters = {};
  ctrl.filters.filterArtifact = false;
  ctrl.filters.filterGroup = false;
  ctrl.filters.filterPublisher = false;
  ctrl.filters.filterCollection = false;
  ctrl.searchCooldown = 300;

  $interval(function () {

    if (ctrl.searchChanged) {

      var typeFilters = '';

      if (ctrl.filters.filterCollection || ctrl.filters.filterArtifact
        || ctrl.filters.filterGroup || ctrl.filters.filterPublisher) {

        typeFilters = '&minRelevance=20&maxResults=50&typeName='
        if (ctrl.filters.filterCollection) {
          typeFilters += 'Collection ';
        }
        if (ctrl.filters.filterArtifact) {
          typeFilters += 'Artifact ';
        }
        if (ctrl.filters.filterGroup) {
          typeFilters += 'Group ';
        }
        if (ctrl.filters.filterPublisher) {
          typeFilters += 'PersonalProfileDocument ';
        }
      }

      $http({
        method: 'GET',
        url: '/api/search?query=' + ctrl.searchInput + typeFilters
      }).then(function successCallback(response) {
        ctrl.results = response.data;
      }, function errorCallback(response) {
      });

      ctrl.searchChanged = false;
    };
  }, ctrl.searchCooldown);

  ctrl.search = function () {
    ctrl.searchChanged = true;
  };

};


