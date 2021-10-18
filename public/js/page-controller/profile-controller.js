function ProfileController($scope, $http) {

  $scope.profileData = data.profile;
  $scope.auth = data.auth;
  $scope.preferredDatabusUsername = "";
  $scope.apiKeys = data.auth.info.apiKeys;
  $scope.createApiKeyName = ""
  $scope.createAccountError = "";
  $scope.createApiKeyError = "";
  $scope.addWebIdUri = "";

  $scope.putProfile = function(accountName, foafName) {

    var profileUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}`;
    var personUri = `${DATABUS_RESOURCE_BASE_URL}/${accountName}#this`;

    var webidGraph = {
      "@graph": [
        {
          "@id": personUri,
          "@type": [
            "http://xmlns.com/foaf/0.1/Person",
            "http://dbpedia.org/ontology/DBpedian"
          ],
          "http://xmlns.com/foaf/0.1/account": { "@id" : profileUri },
          "http://xmlns.com/foaf/0.1/img": { "@id" : "" }, 
          "http://xmlns.com/foaf/0.1/name": foafName
        },
        {
          "@id": profileUri,
          "@type": "http://xmlns.com/foaf/0.1/PersonalProfileDocument",
          "http://xmlns.com/foaf/0.1/maker": { "@id" : personUri },
          "http://xmlns.com/foaf/0.1/primaryTopic": { "@id" : personUri }
        }
      ]
    };

    $http.put(`/${accountName}`, webidGraph).then(function (result) {
      if (result.data.code == DatabusResponse.USER_PROFILE_CREATED) {
        window.location.reload(true);
      }
    }, function (err) {
      console.log(err);
      $scope.createAccountError = err.data;
    });
  }


  if ($scope.profileData == undefined) {

    $scope.createProfile = function () {
      if(!$scope.auth.authenticated) {
        return;
      }

      // Create webId data locally
      var webIdData = {};

      var accountName = $scope.preferredDatabusUsername;

      if(accountName == undefined || !DatabusUtils.isValidAccountName(accountName)) {
        $scope.createAccountError = "Enter a valid account name."
        $scope.showAccountNameHints = true;
        return;
      }

      var name = accountName;

      if($scope.auth.info.oidc_name) {
        name = $scope.auth.info.oidc_name;
      }

      $scope.showAccountNameHints = false;
      $scope.putProfile(accountName, name, '');
    }

    return;
  }

  $scope.removeApiKey = function(key) {
    
    $http.post(`/system/account/api-key/delete?key=${key}`).then(function (result) {
      $scope.apiKeys = $scope.apiKeys.filter(function (k) {
        return k.key != key;
      });

    }, function (err) {
      console.log(err);
      $scope.createApiKeyError = err.data;
    });

    
  }

  $scope.copyToClipboard = function(key) {
    DatabusUtils.copyStringToClipboard(key);
  }

  $scope.addApiKey = function() {
    
    $http.post(`/system/account/api-key/create?name=${encodeURIComponent($scope.createApiKeyName)}`).then(function (result) {
      $scope.apiKeys.push(result.data);

    }, function (err) {
      console.log(err);
      $scope.createApiKeyError = err.data;
    });

  }

  $scope.connectWebid = function() {

    $http.post(`/system/account/webid/add?uri=${encodeURIComponent($scope.addWebIdUri)}`).then(function (result) {
      $scope.webIds.push(result.data);

    }, function (err) {
      console.log(err);
      $scope.addWebIdError = err.data;
    });
  }


  $scope.saveProfile = function () {

    if(!$scope.auth.authenticated) {
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
          "@type": [ "dbo:DBpedian", "foaf:Person"],
          "name": $scope.editData.label,
          "rdfs:comment": $scope.editData.about,
          "account": profileUri,
          "img": $scope.editData.imageUrl
        }
      ]
    };

    if($scope.editData.webIdURI != undefined && $scope.editData.webIdURI != '') {
      webIdData['@graph'].push({
        "@id": $scope.editData.webIdURI,
        "account": profileUri
      });
    }

    $http.put('/' + $scope.auth.info.accountName, webIdData).then(function (result) {
      if (result.data.code == DatabusResponse.USER_PROFILE_UPDATED) {
        window.location.reload(true);
      }
    }, function (err) {
      console.log(err);
    });
  }

  // We have profile data in $scope.profileData!

  if (!$scope.profileData.isOwn) {
    return;
  }

  $scope.editData = DatabusUtils.createCleanCopy($scope.profileData);

  $scope.resetEdits = function () {
    $scope.editData = DatabusUtils.createCleanCopy($scope.profileData);
  }

}