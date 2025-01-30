

// hinzufügen eines Controllers zum Modul
function NavSearchController($http, $interval, $sce, searchManager) {

  var ctrl = this;

  // TODO: get search extensions from the logged in user

  ctrl.searchManager = searchManager;
  ctrl.results = [];

  ctrl.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  ctrl.toggleFilter = function (key) {
    ctrl.filterActive[key] = !ctrl.filterActive[key];
    ctrl.search();
  }

  ctrl.navigateTo = function(uri) {
    window.location = uri;
  }

  ctrl.hideDropdown = function() {

  }

  ctrl.availableResourceTypes = ['Collection', 'Artifact', 'Group', 'Account', 'Version' ];

  ctrl.$onInit = function () {

    ctrl.searchInput = '';
    ctrl.isSearching = false;
    ctrl.searchCooldown = 1000;


    ctrl.filterActive = {};
    ctrl.filterVisible = {};


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

  ctrl.baseQueryFormatter = function(query) {
    return `?query=${query}${ctrl.searchFilter}${ctrl.baseFilters}${ctrl.typeFilters}`
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

      ctrl.baseFilters = baseFilters;
      ctrl.typeFilters = typeFilters;
      ctrl.searchManager.baseAdapter.queryFormatter = ctrl.baseQueryFormatter;

      ctrl.searchManager.search(ctrl.searchInput).then(function success(results) {
        
        for(var result of results) {

          if(result.abstract != null) {
            result.abstract = result.abstract[result.abstract.length - 1];
          }
        }
        
        ctrl.results = results;

        
        ctrl.isSearching = false;
      }, function error(response) {
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

module.exports = NavSearchController;

