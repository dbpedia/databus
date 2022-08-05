

// hinzufügen eines Controllers zum Modul
function SearchController($http, $interval, $sce) {

  var ctrl = this;

  ctrl.results = [];

  ctrl.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  ctrl.toggleFilter = function (key) {
    ctrl.filterActive[key] = !ctrl.filterActive[key];
    ctrl.search();
  }

  ctrl.availableResourceTypes = ['Collection', 'Artifact', 'Group', 'PersonalProfileDocument'];

  ctrl.$onInit = function () {

    ctrl.searchInput = '';
    ctrl.isSearching = false;
    ctrl.searchCooldown = 300;

    if (ctrl.settings == undefined) {
      ctrl.minRelevance = 0.01;
      ctrl.maxResults = 50;
      ctrl.searchFilter = "";
      ctrl.resourceTypes = null;
      ctrl.placeholder = "Search the Databus..."
    } else {
      ctrl.minRelevance = ctrl.settings.minRelevance;
      ctrl.maxResults = ctrl.settings.maxResults;
      ctrl.searchFilter = ctrl.settings.filter;
      ctrl.resourceTypes = ctrl.settings.resourceTypes;
      ctrl.placeholder = ctrl.settings.placeholder;
    }

    ctrl.filterActive = {};
    ctrl.filterVisible = {};

    for (var resourceType of ctrl.availableResourceTypes) {
      ctrl.filterActive[resourceType] = false;
      ctrl.filterVisible[resourceType] = ctrl.resourceTypes == null;
    }

    ctrl.numFilters = 0;

    if (ctrl.resourceTypes != null) {
      for (var resourceType of ctrl.resourceTypes) {
        ctrl.filterVisible[resourceType] = true;
        ctrl.numFilters++;
      }

    }
  }

  ctrl.isAnyFilterActive = function () {

    for (var resourceType of ctrl.availableResourceTypes) {

      if (!ctrl.filterVisible[resourceType]) {
        continue;
      }

      if (ctrl.filterActive[resourceType]) {
        return true;
      }
    }

    return false;
  }

  $interval(function () {

    if (ctrl.searchChanged) {

      var baseFilters = `&minRelevance=${ctrl.minRelevance}&maxResults=${ctrl.maxResults}`;

      var typeFilters = ``;
      var isAnyFilterActive = ctrl.isAnyFilterActive();


      for (var resourceType of ctrl.availableResourceTypes) {

        if (!ctrl.filterVisible[resourceType]) {
          continue;
        }

        if (ctrl.filterActive[resourceType] || !isAnyFilterActive) {

          if (typeFilters == ``) {
            typeFilters = `&typeName=`;
          }

          typeFilters += ` ${resourceType}`;
        }
      }

      var url = `/api/search?query=${ctrl.searchInput}${ctrl.searchFilter}${baseFilters}${typeFilters}`;
      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
        ctrl.isSearching = false;
        ctrl.results = response.data;
      }, function errorCallback(response) {
        ctrl.isSearching = false;
      });

      ctrl.searchChanged = false;
    };
  }, ctrl.searchCooldown);

  ctrl.search = function () {
    ctrl.isSearching = true;
    ctrl.searchChanged = true;
  };

};


