function DatabusSearchController($http, $interval, $sce) {

  var ctrl = this;

  ctrl.searchResults = [];

  ctrl.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  ctrl.$onInit = function () {

    ctrl.input = '';
    ctrl.searchCooldown = 1000;
    ctrl.hasSearchChanged = false;
    ctrl.isSearchReady = true;
  }

  ctrl.invokeSearch = function () {
    if (ctrl.isSearchReady) {
      ctrl.search();
      ctrl.isSearchReady = false;
    } else {
      ctrl.hasSearchChanged = true;
    }
  }

  $interval(function () {
    if (ctrl.hasSearchChanged) {
      ctrl.searchscope();
      ctrl.hasSearchChanged = false;
    }

    ctrl.isSearchReady = true;
  }, ctrl.searchCooldown);

  ctrl.search = function () {

    if (ctrl.input == '') {
      return;
    }

    var filters = '';

    if (ctrl.filters != undefined && ctrl.filters.length > 0) {
      filters = '&' + ctrl.filters.join('&');
    }

    $http({
      method: 'GET',
      url: '/system/search?query=' + ctrl.input + filters
    }).then(function successCallback(response) {

      ctrl.results = [];

      for (var r in response.data.docs) {
        var doc = response.data.docs[r];
        var result = {
          label: doc.label[0],
          desc: doc.comment[0],
          uri: doc.resource[0],
          type: doc.typeName[0]
        };

        ctrl.searchResults.push(result);
      }

    }, function errorCallback(response) {
      console.log(response);
    });
  }
}


