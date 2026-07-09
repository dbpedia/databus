const DatabusAlert = require("../components/databus-alert/databus-alert");
const DatabusUris = require("../utils/databus-uris");
const DatabusUtils = require("../utils/databus-utils");
const JsonldUtils = require("../utils/jsonld-utils");
const TabNavigation = require("../utils/tab-navigation");

function UserSettingsController($scope, $http, $sce, $location) {
  $scope.auth = data.auth;
  $scope.accounts = data.accounts;

  $scope.inputs = {};

  $scope.inputs.newAccountLabel = "";
  $scope.inputs.newAccountName = "";
  $scope.inputs.newApiKeyName = "";

  $scope.tabNavigation = new TabNavigation($scope, $location, [
    ''
  ], function (index) {
    $scope.activeAccount = $scope.accounts[index - 1];
  });

  $scope.$watchCollection('accounts', function (newAccounts) {
    const accountNames = newAccounts.map(a => a.accountName);
    $scope.tabNavigation.tabKeys = [''].concat(accountNames);

    const currentHash = $location.hash();

    $scope.tabNavigation.onLocationHashChanged(currentHash, currentHash)

    if (currentHash && !$scope.tabNavigation.tabKeys.includes(currentHash)) {
      $location.hash('');
    }
  });

  // Iterate over each account and load its data
  $scope.accounts.forEach(function (account) {
    // Set loading state
    account.loading = true;

    var requestParams = {
      method: 'GET',
      url: '/' + encodeURIComponent(account.accountName),
      headers: {
        'Accept': 'application/ld+json',
        'X-Jsonld-Formatting': 'flatten'
      }
    }

    // Perform HTTP GET request to fetch additional data
    $http(requestParams)
      .then(function (response) {
        // Set loading to false when data is received
        account.loading = false;

        // Store additional info (stub)
        var graphs = response.data;
        var personGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSON);

        account.uri = `${DATABUS_RESOURCE_BASE_URL}/${account.accountName}`;
        account.label =  JsonldUtils.getFirstProperty(personGraph, DatabusUris.FOAF_NAME);
        account.status = JsonldUtils.getFirstProperty(personGraph, DatabusUris.FOAF_STATUS);
        account.imageUrl = JsonldUtils.getProperty(personGraph, DatabusUris.FOAF_IMG);
        account.secretaries = [];

        let accountGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.DATABUS_ACCOUNT);
        let secretaryIds = JsonldUtils.getRefArrayProperty(accountGraph, DatabusUris.DATABUS_SECRETARY_PROPERTY);

        for (let secretaryId of secretaryIds) {
          let secretaryGraph = JsonldUtils.getGraphById(graphs, secretaryId);

          let secretary = {};
          secretary.accountName = DatabusUtils.uriToName(JsonldUtils.getProperty(secretaryGraph, DatabusUris.DATABUS_ACCOUNT_PROPERTY));
          secretary.hasWriteAccessTo = JsonldUtils.getRefArrayProperty(secretaryGraph, DatabusUris.DATABUS_HAS_WRITE_ACCESS_TO);

          account.secretaries.push(secretary);
        }

        account.secretaries = DatabusUtils.secretariesForEdit(account.secretaries, account.accountName);

      })
      .catch(function (error) {
        // Handle error and set loading to false
        account.loading = false;
        console.error('Failed to load account data for', account.name, error);
      });
  });

  // Button click handler to add account
  $scope.addAccount = async function () {

    try {

      await $http.post(`/api/account/create`, {
        name: $scope.inputs.newAccountName,
        label: $scope.inputs.newAccountLabel
      });

      $scope.accounts.push({
        label: $scope.inputs.newAccountLabel,
        accountName: $scope.inputs.newAccountName,
        uri: `${DATABUS_RESOURCE_BASE_URL}/${$scope.inputs.newAccountName}`
      });

      DatabusAlert.alert($scope, true, "Account created.");

    } catch (err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }
  };

  // Button click handler to save account
  $scope.saveAccount = async function (account) {
    try {
      var payload = DatabusUtils.createCleanCopy(account);
      payload.secretaries = DatabusUtils.secretariesForSave(payload.secretaries, account.accountName);
      await $http.post(`/api/account/update`, payload);
      DatabusAlert.alert($scope, true, "Account saved.");

    } catch (err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }

  };

  $scope.getWriteAccessPrefix = function (accountName) {
    return DatabusUtils.getAccountNamespacePrefix(accountName);
  };

  // Button click handler to delete account
  $scope.deleteAccount = async function (account) {
    try {
      // Find index of the account using accountName
      const index = $scope.accounts.findIndex(acc => acc.accountName === account.accountName);

      if (index === -1) {
        throw new Error(`Account with name "${account.accountName}" not found.`);
      }

      console.log("Deleting account with accountName:", account.accountName);

      // Send delete request to server
      await $http.post(`/api/account/delete`, account);

      // Show success alert
      DatabusAlert.alert($scope, true, "Account deleted.");

      // Remove account from local array
      $scope.accounts.splice(index, 1);

    } catch (err) {
      console.error(err);
      const message = err.data || err.message || "Unknown error occurred.";
      DatabusAlert.alert($scope, false, message);
    }
  };




  $scope.goToUserSettings = function (accountName) {
    window.location.href = '/' + encodeURIComponent(accountName) + '#settings';
  }

  $scope.addWriteAccessUrl = function (account) {
    account.writeAccess.push('');
  };

  $scope.removeWriteAccessUrl = function (account, index) {
    account.writeAccess.splice(index, 1);
  };

  $scope.addApiKey = async function (account) {
    // Validate the name input only

    if (!$scope.inputs.newApiKeyName) {
      DatabusAlert.alert("API key name must be provided.");
      return;
    }

    const postData = {
      accountName: account.accountName,
      name: $scope.inputs.newApiKeyName
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
        $scope.inputs.newApiKeyName = '';

        DatabusAlert.alert($scope, true, "API key created.");
      } else {
        DatabusAlert.alert($scope, false, "Failed to create API key.");
      }

    } catch (error) {
      console.error('Error creating API key:', error);
      const message = err.data || err.message || "Unknown error occurred.";
      DatabusAlert.alert($scope, false, message);
    }
  };


  $scope.deleteApiKey = async function (account, apiKey) {
    try {
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
    if (!account.secretaries) {
      account.secretaries = [];
    }

    account.secretaries.push({
      accountName: '',
      hasWriteAccessTo: []
    });
  };

  $scope.removeSecretary = function (account, index) {
    account.secretaries.splice(index, 1);
  };

  $scope.addNamespace = function (account, secIndex) {
    account.secretaries[secIndex].hasWriteAccessTo.push('');
  };

  $scope.removeNamespace = function (account, secIndex, nsIndex) {
    account.secretaries[secIndex].hasWriteAccessTo.splice(nsIndex, 1);
  };
}

module.exports = UserSettingsController;