const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const SearchAdapter = require("../search/search-adapter");
const DatabusMessages = require("../utils/databus-messages");
const DatabusConstants = require("../utils/databus-constants");
const AppJsonFormatter = require("../utils/app-json-formatter");

function ProfileController($scope, $http) {

  $scope.account = data.account;
  $scope.auth = data.auth;

  if (data.owner != null) {
    $scope.account.apiKeys = data.owner.apiKeys;
  }
  $scope.auth = data.auth;
  $scope.preferredDatabusUsername = "";
  $scope.createApiKeyName = ""
  $scope.createAccountError = "";
  $scope.createApiKeyError = "";
  $scope.addWebIdUri = "";
  $scope.deleteAccountName = "";
  $scope.grantAccessUri = "";
  $scope.adapters = SearchAdapter.list;
  $scope.utils = new DatabusWebappUtils($scope);

  $scope.accountName = $scope.utils.getAccountName();

  $scope.personUri = `${DATABUS_RESOURCE_BASE_URL}/${$scope.accountName}${DatabusConstants.WEBID_THIS}`;

  $scope.putProfile = function (accountName) {

    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}`;
    var accountJsonLd = AppJsonFormatter.createAccountData(
      accountUri,
      accountName,
      null,
      null);

    $http.post(`/api/register`, accountJsonLd).then(function (result) {
      window.location.reload(true);
    }, function (err) {
      console.log(err);
      $scope.createAccountError = err.data;
    });
  }


  if ($scope.account == undefined) {

    $scope.createProfile = function () {

      if ($scope.isSubmitting) {
        return;
      }

      $scope.isSubmitting = true;

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

  $scope.addApiKey = async function () {
    // Validate the name input only

    if (!$scope.createApiKeyName) {
      DatabusAlert.alert("API key name must be provided.");
      return;
    }

    let account = $scope.account;

    const postData = {
      accountName: account.accountName,
      keyname: $scope.createApiKeyName
    };

    try {
      // Send POST request to create the API key
      let response = await $http.post('/api/account/api-key/create', postData);

      if (response.data && response.data.apikey && response.data.keyname) {
        // Append new key to the list
        account.apiKeys.push({
          keyname: response.data.keyname,
          apikey: response.data.apikey
        });

        // Clear the name input field
        $scope.createApiKeyName = '';

        DatabusAlert.alert($scope, true, "API key created.");
      } else {
        DatabusAlert.alert($scope, false, "Failed to create API key.");
      }

    } catch (error) {
      console.error('Error creating API key:', error);
      const message = error.data || error.message || "Unknown error occurred.";
      DatabusAlert.alert($scope, false, message);
    }
  };


  $scope.deleteApiKey = async function (apiKey) {
    try {

      let account = $scope.account;
      // Find index of the account using accountName
      const index = account.apiKeys.findIndex(key => key.keyname === apiKey.keyname);

      if (index === -1) {
        throw new Error(`API key with name "${apiKey.keyname}" not found.`);
      }

      console.log("Deleting API key with keyname:", apiKey.keyname);

      // Send delete request to server
      await $http.post(`/api/account/api-key/delete`, { accountName: account.accountName, keyname: apiKey.keyname });
      account.apiKeys.splice(index, 1);

      // Show success alert
      DatabusAlert.alert($scope, true, "API key deleted.");

    } catch (err) {
      console.error(err);



      const message = err.data || err.message || "Unknown error occurred.";
      DatabusAlert.alert($scope, false, message);
    }
  };

  $scope.addSecretary = function (account) {
    if (!$scope.editData.secretaries) {
      $scope.editData.secretaries = [];
    }

    $scope.editData.secretaries.push({
      accountName: '',
      hasWriteAccessTo: []
    });
  };

  $scope.removeSecretary = function (account, index) {
    $scope.editData.secretaries.splice(index, 1);
  };

  $scope.addNamespace = function (account, secIndex) {
    $scope.editData.secretaries[secIndex].hasWriteAccessTo.push('');
  };

  $scope.removeNamespace = function (account, secIndex, nsIndex) {
    $scope.editData.secretaries[secIndex].hasWriteAccessTo.splice(nsIndex, 1);
  };


  $scope.onCreateApiKeyNameChanged = function () {
    var hasError = !DatabusUtils.isValidResourceLabel($scope.createApiKeyName, 3, 20);
    $scope.createApiKeyError = hasError ? " API key name must have between 3 and 20 characters and match [A-Za-z0-9\\s_()\\.\\,\\-]*" : "";
  }


  $scope.removeSearchExtension = function (uri) {
    $http.post(`/api/account/mods/search-extensions/remove?uri=${encodeURIComponent(uri)}`)
      .then(function (result) {
        console.log(result);
        DatabusAlert.alert($scope, true, result.data);

        $scope.account.searchExtensions = $scope.account.searchExtensions.filter(function (e) {
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
        $scope.account.searchExtensions.push({
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
      $scope.account.authorizedAccounts.push($scope.grantAccessUri);
    }, function (err) {
      console.log(err);
      $scope.grantAccessError = err.data;
    });
  }

  $scope.revokeAccess = function (uri) {
    $http.post(`/api/account/access/revoke?uri=${encodeURIComponent(uri)}`).then(function (result) {
      $scope.account.authorizedAccounts = $scope.account.webIds.filter(function (value, index, arr) {
        return value != uri;
      });
    }, function (err) {
      console.log(err);
      $scope.grantAccessError = err.data;
    });
  }

  $scope.connectWebid = function () {

    $http.post(`/api/account/webid/add?uri=${encodeURIComponent($scope.addWebIdUri)}`).then(function (result) {
      $scope.account.webIds.push($scope.addWebIdUri);
      DatabusAlert.alert($scope, true, DatabusMessages.ACCOUNT_WEBID_LINKED);

    }, function (err) {
      console.log(err);
      $scope.addWebIdError = err.data;
    });
  }

  $scope.removeWebId = function (webIdToRemove) {

    $http.post(`/api/account/webid/remove?uri=${encodeURIComponent(webIdToRemove)}`).then(function (result) {

      $scope.account.webIds = $scope.account.webIds.filter(function (value, index, arr) {
        return value != webIdToRemove;
      });

    }, function (err) {
      console.log(err);
      $scope.addWebIdError = err.data;
    });
  }


  $scope.deleteAccount = async function () {
    let account = $scope.account;
    let name = $scope.deleteAccountName;

    try {
      let response = await $http.post(`/api/account/delete`, { accountName: name });

      window.location = `/app/user`;

    } catch (err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }

  }

  $scope.updateAccount = async function () {

    if (!$scope.auth.authenticated) {
      return;
    }

    let account = {};
    account.uri = $scope.editData.uri;

    account.accountName = $scope.editData.accountName;
    account.label = $scope.editData.label;
    account.status = $scope.editData.about;
    account.imageUrl = $scope.editData.imageUrl;
    account.secretaries = DatabusUtils.secretariesForSave(
      $scope.editData.secretaries,
      account.accountName
    );


    try {
      await $http.post(`/api/account/update`, account);
      DatabusAlert.alert($scope, true, "Account saved.");

    } catch (err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }
  }


  // We have profile data in $scope.account!

  if (!$scope.account.isOwn) {
    return;
  }

  $scope.modsSettings = {}
  $scope.modsSettings.searchExtensionURI = "";
  $scope.modsSettings.searchExtensionAdapter = $scope.adapters[0];

  $scope.getWriteAccessPrefix = function (accountName) {
    return DatabusUtils.getAccountNamespacePrefix(accountName);
  };

  $scope.getSecretaryAccountPrefix = function () {
    return DatabusUtils.getDatabusAccountPrefix();
  };

  function initEditData() {
    var copy = DatabusUtils.createCleanCopy($scope.account);
    copy.secretaries = DatabusUtils.secretariesForEdit(copy.secretaries, copy.accountName);
    return copy;
  }

  $scope.editData = initEditData();

  $scope.resetEdits = function () {
    $scope.editData = initEditData();
  }

}

module.exports = ProfileController;