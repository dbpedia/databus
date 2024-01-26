const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const PublishSession = require("../publish/publish-session");

// Controller for the header section
function PublishWizardController($scope, $http, $interval, focus, $q) {

  $scope.login = function () {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.utils = new DatabusWebappUtils($scope);

  $scope.createAccount = function () {
    window.location = '/app/account';
  }

     // Login function
     $scope.login = function () {
      window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
    }

  $scope.authenticated = data.auth.authenticated;
  $scope.loadRequestCount = 0;
  $scope.texts = data.texts;

  $scope.nerdMode = {};
  $scope.nerdMode.enabled = false;
  $scope.nerdMode.customJson = "";
  $scope.nerdMode.logLevelOptions = ['error', 'info', 'debug'];
  $scope.nerdMode.logLevel = 'error';

  // controller does not work without authentication
  if (!$scope.authenticated) {
    return;
  }

  $scope.hasAccount = data.auth.info.accountName != undefined;;

  if (!$scope.hasAccount) {
    return;
  }

  /**
   * Fetches existing groups and artifacts
   */
  $scope.getContentForAccount = async function (accountName) {

    $scope.isAccountDataLoading = true;
    var uri = `/app/account/content?account=${encodeURIComponent(accountName)}`;
    var response = await $http.get(uri);
    $scope.isAccountDataLoading = false;

    // Put account artifacts, groups and name in one object
    var accountData = response.data;
    accountData.accountName = accountName;

    accountData.publisherUris = [];
    for (var p of data.publisherData) {
      accountData.publisherUris.push(p.publisherUri);
    }

    // Try to resume the session with the account data
    var session = PublishSession.resume($http, accountData);

    // Resume failed -> start new session
    if (session == null) {
      session = new PublishSession($http, null, accountData);
    }

    $scope.session = session;
    $scope.$watch('session', function () {
      $scope.session.onChange();
    }, true);

    $scope.$apply();
  }

  $scope.getContentForAccount(data.auth.info.accountName);

  /**
   * LICENSES
   */

  $scope.licenseQuery = "";

  $interval(function () {
    if ($scope.hasLicenseQueryChanged) {

      $http.get(`/app/publish-wizard/licenses?limit=30&keyword=${$scope.licenseQuery}`).then(function(response) {
        $scope.filteredLicenseList = response.data.results.bindings;
      });

      $scope.hasLicenseQueryChanged = false;
    }

  }, 300);

  $scope.filterLicenses = function (licenseQuery) {
    $scope.licenseQuery = licenseQuery;
    $scope.hasLicenseQueryChanged = true;
  }

  $scope.filterLicenses("");

  $scope.addFile = function (input) {

    var session = $scope.session;

    if (input == undefined || input.length == 0) {
      return;
    }

    $scope.loadRequestCount++;

    $http.get('/app/publish-wizard/fetch-file?url=' + encodeURIComponent(input)).then(function (response) {

      $scope.loadRequestCount--;
      if (response.data == null || response.data == "" || response.status != 200) {
        return;
      }

      session.addFile(response.data);

    }, function (err) { });
  }

  $scope.objSize = function (obj) {
    return DatabusUtils.objSize(obj);
  }

  $scope.removeFile = function (fileGroup) {
    var files = $scope.session.formData.version.files;
    files.splice(files.findIndex(f => f.uri == fileGroup.uri), 1);
    $scope.session.formData.version.isConfigDirty = true;
  }

  $scope.hasError = function (errorList, error) {
    return errorList.includes(error);
  }

  // Fetch links using the fetch-links API of the Databus
  $scope.fetchFiles = function (parentUri) {

    $http.get('/app/publish-wizard/fetch-resource-page?url=' + encodeURIComponent(parentUri)).then(function (response) {
      for (var i in response.data) {
        var uri = response.data[i];
        $scope.addFile(uri);
      }
    }, function (err) {
    });
  }

  $scope.addFiles = function (input) {
    var lines = input.split('\n');

    for (var line of lines) {
      if (line != undefined && line.length > 0) {
        $scope.addFile(line);
      }
    }
  }

  $scope.createTractate = function () {
    $scope.creatingTractate = true;
    $http.post('/api/tractate/v1/canonicalize', $scope.session.inputs.dataid).then(function (response) {
      $scope.session.formData.signature.tractate = response.data;
      $scope.creatingTractate = false;
    }, function (err) {
      $scope.creatingTractate = false;
      console.log(err);
    });
  }

  $scope.customPublish = async function () {
    var options = {}
    options.headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }


    $scope.isPublishing = true;
    $http.post(`/api/publish?fetch-file-properties=true&log-level=${$scope.nerdMode.logLevel}`, $scope.nerdMode.customJson, options)
      .then(function (response) {
        $scope.publishLog = response.data.log;
        $scope.isPublishing = false;
      }, function (err) {
        $scope.publishLog = err.data.log;
        $scope.isPublishing = false;
        console.log(err);
      });
  }


  $scope.publish = async function () {
    var options = {}
    options.headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }

    $scope.isPublishing = true;
    $http.post('/api/publish?fetch-file-properties=true&log-level=info', $scope.session.inputs.all, options)
      .then(function (response) {
        $scope.publishLog = response.data.log;
        $scope.isPublishing = false;
      }, function (err) {
        $scope.publishLog = err.data.log;
        $scope.isPublishing = false;
        console.log(err);
      });
  }
}


module.exports = PublishWizardController;