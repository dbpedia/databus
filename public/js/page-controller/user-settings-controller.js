const DatabusAlert = require("../components/databus-alert/databus-alert");
const DatabusUris = require("../utils/databus-uris");
const JsonldUtils = require("../utils/jsonld-utils");

function UserSettingsController($scope, $http, $sce, $location) {
  $scope.auth = data.auth;
  $scope.accounts = data.accounts;

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
        console.log(personGraph);
        

        // Optionally, parse specific properties from JSON-LD if needed
        // Example: account.description = response.data['@graph'][0].description;
      })
      .catch(function(error) {
        // Handle error and set loading to false
        account.loading = false;
        console.error('Failed to load account data for', account.name, error);
      });
  });

  console.log($scope.accounts);
  
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

  $scope.apiKeys = [
    // Example entry
    { name: 'default', key: '1234-5678-ABCD-EFGH' }
  ];
  
  $scope.addApiKey = function () {
    if (!$scope.newApiKeyName || !$scope.newApiKeyValue) {
      DatabusAlert.alert("Both name and key must be filled out.");
      return;
    }
  
    $scope.apiKeys.push({
      name: $scope.newApiKeyName,
      key: $scope.newApiKeyValue
    });
  
    // Clear input fields
    $scope.newApiKeyName = '';
    $scope.newApiKeyValue = '';
  };
  
  $scope.deleteApiKey = function (index) {
    console.log("Deleting API key:", $scope.apiKeys[index]);
    $scope.apiKeys.splice(index, 1);
    // TODO: Implement backend delete if needed
  };
}

module.exports = UserSettingsController;