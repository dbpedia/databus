
// Controller for the header section
function HeaderController($scope, $http, collectionManager) {

  $scope.auth = data.auth;
  $scope.authenticated = data.auth.authenticated;

  // Check for cookie settings
  $scope.databusCookieConsentKey = 'databus_cookie_consent';
  let cookieConsent = window.localStorage.getItem($scope.databusCookieConsentKey);
  $scope.showCookieDialogue = cookieConsent === undefined;
  
  
  // Collection Manager Init
  $scope.collectionManager = collectionManager;

  if($scope.collectionManager.isInitialized) {
    $scope.collectionManager.findActive();
  }

  if($scope.authenticated) {
    $scope.collectionManager.tryInitialize();
  }

  // Finds a display name for the account
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

  $scope.isMenuActive = false;

  // Coookieees
  $scope.giveCookieConsent = function () {
    window.localStorage.setItem($scope.databusCookieConsentKey, true);
    $scope.showCookieDialogue = false;
  }

  // Login function
  $scope.login = function () {
    window.location = '/system/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  // Logout function
  $scope.logout = function () { 
    window.location = '/system/logout?redirectUrl=' + encodeURIComponent(window.location);
  }

  // ???
  $scope.size = function () {
    if ($scope.collectionManager == null) {
      return "";
    }

    var first = $scope.collectionManager.current;
    return first != null ? first.elements.length : "";
  }
}
