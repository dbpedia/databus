
// Controller for the header section
function HeaderController($scope, $http, collectionManager) {

  $scope.auth = data.auth;

  $scope.authenticated = data.auth.authenticated;

  // Check for cookie settings
  $scope.databusCookieConsentKey = 'databus_cookie_consent';
  let cookieConsent = window.localStorage.getItem($scope.databusCookieConsentKey);
  $scope.showCookieDialogue = cookieConsent === undefined;
  $scope.collectionManager = collectionManager;

  //TODO authenticated doesnt work, so it never initialize CollectionManager and remote collection stay empty
  if($scope.authenticated  && !$scope.collectionManager.isInitialized) {
    $http.get(`/system/pages/account/collections?account=${$scope.auth.info.accountName}`).then(function (res) {
      $scope.collectionManager.initialize(res.data);
    });
  }

  $scope.getAccountName = function() {
    if($scope.auth.info.accountName) {
      return $scope.auth.info.accountName;
    }
    
    if($scope.auth.info.oidc_email) {
      return $scope.auth.info.oidc_email;
    }
    
    if($scope.auth.info.oidc_name) {
      return $scope.auth.info.oidc_name;
    }

    return null;
  }

  if($scope.collectionManager.isInitialized) {
    $scope.collectionManager.findActive();


  }

  $scope.isMenuActive = false;

  $scope.login = function () {
    window.location = '/system/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.giveCookieConsent = function () {
    window.localStorage.setItem($scope.databusCookieConsentKey, true);
    $scope.showCookieDialogue = false;
  }

  $scope.logout = function () { 
    window.location = '/system/logout?redirectUrl=' + encodeURIComponent(window.location);
  }

  setTimeout(function () {
    $scope.$watch(function () { return $scope.size() }, function (oldValue, newValue) {
      if (oldValue != "") {
        $('#cart-icon').addClass('pulseit');
        setTimeout(function () {
          $('#cart-icon').removeClass('pulseit');
        }, 600);
      }
    })
  }, 500);


  $scope.size = function () {
    if ($scope.collectionManager == null) {
      return "";
    }

    var first = $scope.collectionManager.current;
    return first != null ? first.elements.length : "";
  }

  $scope.register = function () {
  };

  $scope.manageAccount = function () {

  };
}
