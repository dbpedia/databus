const DatabusAlert = require("../components/databus-alert/databus-alert");
const DatabusUris = require("../utils/databus-uris");
const JsonldUtils = require("../utils/jsonld-utils");

function UserSettingsController($scope, $http, $sce, $location) {
  $scope.auth = data.auth;
  $scope.accounts = data.accounts;
  $scope.apiKeys = data.apiKeys;

  // Iterate over each account
  $scope.accounts.forEach(function(account) {
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
      .then(function(response) {
        // Set loading to false when data is received
        account.loading = false;

        // Store additional info (stub)
        var graphs = response.data;
        var personGraph = JsonldUtils.getTypedGraph(graphs, DatabusUris.FOAF_PERSON);

        account.label = JsonldUtils.getProperty(personGraph, DatabusUris.FOAF_NAME);
      })
      .catch(function(error) {
        // Handle error and set loading to false
        account.loading = false;
        console.error('Failed to load account data for', account.name, error);
      });
  });

  $scope.addAccount = async function () {

    try {
      await $http.post(`/api/account/create`, { 
        name: $scope.newAccountName,
        label: $scope.newAccountLabel
      });

      $scope.accounts.push({
        label : $scope.newAccountLabel,
        accountName : $scope.newAccountName
      });

      DatabusAlert.alert($scope, true, "Account created.");

    } catch(err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }

  };

  $scope.saveAccount = async function (account) {
    try {
      console.log(account);
      
      await $http.post(`/api/account/save`, account);
      DatabusAlert.alert($scope, true, "Account saved.");

    } catch(err) {
      console.error(err);
      DatabusAlert.alert($scope, false, err.data);
    }

  };

  $scope.deleteAccount = function (index) {
    console.log("Deleting account at index:", index);
    $scope.accounts.splice(index, 1);
    // TODO: implement backend delete call
  };

  $scope.addWriteAccessUrl = function (account) {
    account.writeAccess.push('');
  };

  $scope.removeWriteAccessUrl = function (account, index) {
    account.writeAccess.splice(index, 1);
  };

   
  $scope.addApiKey = function () {
    // Validate the name input only
    if (!$scope.newApiKeyName) {
      DatabusAlert.alert("API key name must be provided.");
      return;
    }

    const postData = {
      name: $scope.newApiKeyName
    };

    // Send POST request to create the API key
    $http.post('/api/account/api-key/create', postData)
      .then(function(response) {
        if (response.data && response.data.key && response.data.name) {
          // Append new key to the list
          $scope.apiKeys.push({
            name: response.data.name,
            key: response.data.key
          });

          // Clear the name input field
          $scope.newApiKeyName = '';
        } else {
          DatabusAlert.alert("Invalid response from server.");
        }
      })
      .catch(function(error) {
        console.error('Error creating API key:', error);
        DatabusAlert.alert("Failed to create API key.");
      });
  };
  
  
  $scope.deleteApiKey = function (index) {
    console.log("Deleting API key:", $scope.apiKeys[index]);
    $scope.apiKeys.splice(index, 1);
    // TODO: Implement backend delete if needed
  };
}

module.exports = UserSettingsController;