const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const SearchAdapter = require("../search/search-adapter");
const DatabusMessages = require("../utils/databus-messages");
const DatabusConstants = require("../utils/databus-constants");
const AppJsonFormatter = require("../utils/app-json-formatter");
const DatabusUris = require("../utils/databus-uris");

function ProfileController($scope, $http) {

  $scope.profileData = data.profile;
  $scope.auth = data.auth;
  $scope.preferredDatabusUsername = "";
  $scope.apiKeys = data.auth.info.apiKeys;
  $scope.createApiKeyName = ""
  $scope.createAccountError = "";
  $scope.createApiKeyError = "";
  $scope.addWebIdUri = "";
  $scope.grantAccessUri = "";
  $scope.adapters = SearchAdapter.list;
  $scope.utils = new DatabusWebappUtils($scope);

  $scope.personUri = `${DATABUS_RESOURCE_BASE_URL}/${$scope.auth.info.accountName}${DatabusConstants.WEBID_THIS}`;

  $scope.putProfile = function (accountName) {


    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}`;
    var profileUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}${DatabusConstants.WEBID_DOCUMENT}`;
    var personUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}${DatabusConstants.WEBID_THIS}`;

    accountJsonLd = {};

    var personGraph = {};
    personGraph[DatabusUris.JSONLD_ID] = personUri;
    personGraph[DatabusUris.JSONLD_TYPE] = [
      DatabusUris.FOAF_PERSON,
      DatabusUris.DBP_DBPEDIAN
    ];
    personGraph[DatabusUris.FOAF_NAME] = accountName;
    personGraph[DatabusUris.FOAF_ACCOUNT] = {};
    personGraph[DatabusUris.FOAF_ACCOUNT][DatabusUris.JSONLD_ID] = accountUri;

    var profileGraph = {};
    profileGraph[DatabusUris.JSONLD_ID] = profileUri;
    profileGraph[DatabusUris.JSONLD_TYPE] = DatabusUris.FOAF_PERSONAL_PROFILE_DOCUMENT;
    profileGraph[DatabusUris.FOAF_PRIMARY_TOPIC] = {};
    profileGraph[DatabusUris.FOAF_PRIMARY_TOPIC][DatabusUris.JSONLD_ID] = personUri;
    profileGraph[DatabusUris.FOAF_MAKER] = {};
    profileGraph[DatabusUris.FOAF_MAKER][DatabusUris.JSONLD_ID] = personUri;

    accountJsonLd[DatabusUris.JSONLD_GRAPH] = [
      personGraph,
      profileGraph
    ];

    $http.put(`/${accountName}`, accountJsonLd).then(function (result) {
      window.location.reload(true);
    }, function (err) {
      console.log(err);
      $scope.createAccountError = err.data;
    });
  }


  if ($scope.profileData == undefined) {

    $scope.createProfile = function () {
      if (!$scope.auth.authenticated) {
        return;
      }

      var accountName = $scope.preferredDatabusUsername;

      if (accountName == undefined || !DatabusUtils.isValidAccountName(accountName)) {
        $scope.createAccountError = "Enter a valid account name."
        $scope.showAccountNameHints = true;
        return;
      }

      $scope.showAccountNameHints = false;
      $scope.putProfile(accountName);
    }

    return;
  }

  $scope.removeApiKey = function (key) {

    $http.post(`/api/account/api-key/delete?name=${key.keyname}`).then(function (result) {
      $scope.apiKeys = $scope.apiKeys.filter(function (k) {
        return k.keyname != key.keyname;
      });

    }, function (err) {
      console.log(err);
      $scope.createApiKeyError = err.data;
    });
  }

  $scope.onCreateApiKeyNameChanged = function () {
    var hasError = !DatabusUtils.isValidResourceLabel($scope.createApiKeyName, 3, 20);
    $scope.createApiKeyError = hasError ? " API key name must have between 3 and 20 characters and match [A-Za-z0-9\\s_()\\.\\,\\-]*" : "";
  }

  $scope.addApiKey = function () {

    $http.post(`/api/account/api-key/create?name=${encodeURIComponent($scope.createApiKeyName)}`).then(function (result) {

      if (result.data != null) {
        $scope.apiKeys.push(result.data);
      }

      DatabusAlert.alert($scope, true, DatabusMessages.ACCOUNT_API_KEY_CREATED);

    }, function (err) {
      console.log(err);
      $scope.createApiKeyError = err.data;
    });

  }

  $scope.removeSearchExtension = function(uri) {
    $http.post(`/api/account/mods/search-extensions/remove?uri=${encodeURIComponent(uri)}`)
    .then(function (result) {
      console.log(result);
      DatabusAlert.alert($scope, true, result.data);

      $scope.profileData.searchExtensions =  $scope.profileData.searchExtensions.filter(function (e) {
        return e.endpointUri != uri;
      });

    }, function (err) {
      console.log(err);
      DatabusAlert.alert($scope, false, err.data);
    });
  }

  $scope.addSearchExtension = function () {
    var uri = $scope.modsSettings.searchExtensionURI;
    var adapter = $scope.modsSettings.searchExtensionAdapter.name;

    $http.post(`/api/account/mods/search-extensions/add?uri=${encodeURIComponent(uri)}&adapter=${adapter}`)
      .then(function (result) {
        console.log(result);
        DatabusAlert.alert($scope, true, result.data);
        $scope.profileData.searchExtensions.push({
          endpointUri: uri,
          adapter: adapter
        });
      }, function (err) {
        console.log(err);
        DatabusAlert.alert($scope, false, err.data);
      });
  }

  $scope.grantAccess = function () {
    $http.post(`/api/account/access/grant?uri=${encodeURIComponent($scope.grantAccessUri)}`).then(function (result) {
      $scope.profileData.authorizedAccounts.push($scope.grantAccessUri);
    }, function (err) {
      console.log(err);
      $scope.grantAccessError = err.data;
    });
  }

  $scope.revokeAccess = function (uri) {
    $http.post(`/api/account/access/revoke?uri=${encodeURIComponent(uri)}`).then(function (result) {
      $scope.profileData.authorizedAccounts = $scope.profileData.webIds.filter(function (value, index, arr) {
        return value != uri;
      });
    }, function (err) {
      console.log(err);
      $scope.grantAccessError = err.data;
    });
  }

  $scope.connectWebid = function () {

    $http.post(`/api/account/webid/add?uri=${encodeURIComponent($scope.addWebIdUri)}`).then(function (result) {
      $scope.profileData.webIds.push($scope.addWebIdUri);
      DatabusAlert.alert($scope, true, DatabusMessages.ACCOUNT_WEBID_LINKED);

    }, function (err) {
      console.log(err);
      $scope.addWebIdError = err.data;
    });
  }

  $scope.removeWebId = function (webIdToRemove) {

    $http.post(`/api/account/webid/remove?uri=${encodeURIComponent(webIdToRemove)}`).then(function (result) {

      $scope.profileData.webIds = $scope.profileData.webIds.filter(function (value, index, arr) {
        return value != webIdToRemove;
      });

    }, function (err) {
      console.log(err);
      $scope.addWebIdError = err.data;
    });
  }


  $scope.saveProfile = async function () {

    if (!$scope.auth.authenticated) {
      return;
    }

    // Create webId data locally
    var profileUri = `${DATABUS_RESOURCE_BASE_URL}/${$scope.auth.info.accountName}`;
    var personUri = `${DATABUS_RESOURCE_BASE_URL}/${$scope.auth.info.accountName}#this`;

    var webIdData =
    {
      "@context": JSONLD_CONTEXT,
      "@graph": [
        {
          "@id": profileUri,
          "@type": "foaf:PersonalProfileDocument",
          "maker": personUri,
          "primaryTopic": personUri,
        },
        {
          "@id": personUri,
          "@type": ["dbo:DBpedian", "foaf:Person"],
          "name": $scope.editData.label,
          "rdfs:comment": $scope.editData.about,
          "account": profileUri,
          "img": $scope.editData.imageUrl
        }
      ]
    };

    if ($scope.editData.webIdURI != undefined && $scope.editData.webIdURI != '') {
      webIdData['@graph'].push({
        "@id": $scope.editData.webIdURI,
        "account": profileUri
      });
    }


    $http.put('/' + $scope.auth.info.accountName, webIdData).then(function (result) {
      DatabusAlert.alert($scope, true, DatabusMessages.ACCOUT_PROFILE_SAVED);
    }, function (err) {
      console.log(err);
    });
  }

  // We have profile data in $scope.profileData!

  if (!$scope.profileData.isOwn) {
    return;
  }

  $scope.modsSettings = {}
  $scope.modsSettings.searchExtensionURI = "";
  $scope.modsSettings.searchExtensionAdapter = $scope.adapters[0];


  $scope.editData = DatabusUtils.createCleanCopy($scope.profileData);

  $scope.resetEdits = function () {
    $scope.editData = DatabusUtils.createCleanCopy($scope.profileData);
  }

}

module.exports = ProfileController;