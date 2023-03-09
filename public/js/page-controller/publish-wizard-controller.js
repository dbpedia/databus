// Controller for the header section
function PublishWizardController($scope, $http, focus, $q) {


  // TODO
  // console.log(data.licenseData);
  // Test cases:
  // https://www.pik-potsdam.de/members/giannou/sample-output-remind/at_download/file
  // https://data.dnb.de/opendata/?C=M;O=D
  // http://caligraph.org/resources.html
  // https://openenergy-platform.org/ontology/oeo

  $scope.login = function () {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.createAccount = function () {
    window.location = '/app/account';
  }

  $scope.authenticated = data.auth.authenticated;
  $scope.loadRequestCount = 0;
  $scope.texts = data.texts;

  $scope.nerdMode = {};
  $scope.nerdMode.enabled = false;
  $scope.nerdMode.customJson = "";
  $scope.nerdMode.logLevelOptions = [ 'error', 'info', 'debug' ];
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
    var session = PublishSession.resume(accountData);

    // Resume failed -> start new session
    if (session == null) {
      session = new PublishSession(null, accountData);
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
  $scope.filterLicenses = function (licenseQuery) {
    // billo-suche mit lowercase und tokenization 
    var tokens = licenseQuery.toLowerCase().split(' ');
    $scope.filteredLicenseList = data.licenseData.results.bindings.filter(function (l) {
      for (var token of tokens) {
        if (!l.title.value.toLowerCase().includes(token)) {
          return false;
        }
      }

      return true;
    });
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

  $scope.hasError = function(errorList, error) {
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

  $scope.createTractate = function (graph) {
    $scope.creatingTracate = true;
    $http.post('/api/tractate/v1/canonicalize', graph).then(function (response) {
      $scope.session.data.signature.tractate = response.data;
      $scope.creatingTracate = false;
    }, function (err) {
      $scope.creatingTracate = false;
      console.log(err);
    });
  }

  $scope.customPublish = async function() {
    var options = {}
    options.headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }


    $scope.isPublishing = true;
    $http.post(`/api/publish?verify-parts=true&log-level=${$scope.nerdMode.logLevel}`, $scope.nerdMode.customJson, options)
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
    $http.post('/api/publish?verify-parts=true&log-level=info', $scope.session.inputs.all, options)
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


