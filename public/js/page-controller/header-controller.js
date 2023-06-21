var DatabusWebappUtils = require("../utils/databus-webapp-utils");

// Controller for the header section
function HeaderController($scope, $http, collectionManager, searchManager) {

  $scope.auth = data.auth;
  $scope.authenticated = data.auth.authenticated;

  $scope.accountName = null;
  $scope.utils = new DatabusWebappUtils($scope);
  
  if($scope.authenticated && $scope.auth.info != null) {
    $scope.accountName = $scope.auth.info.accountName;
  }

  // Check for cookie settings
  $scope.databusCookieConsentKey = 'databus_cookie_consent';
  let cookieConsent = window.localStorage.getItem($scope.databusCookieConsentKey);
  $scope.showCookieDialogue = cookieConsent === undefined;

  if ($scope.authenticated) {
    $scope.collectionManager = collectionManager;
    // Collection Manager Init
    var loadCollectionsFromServer = $scope.collectionManager.accountName != $scope.auth.info.accountName;

    $scope.collectionManager.tryInitialize($scope.auth.info.accountName, loadCollectionsFromServer);

    // Initialize search manager
    searchManager.initialize();
  }

  $scope.hideAccountMenu = function() {
    $scope.isAccountMenuActive = false;
  }

  $scope.showAccountMenu = function() {
    $scope.isAccountMenuActive = true;
  }

  // Finds a display name for the account
  $scope.getAccountName = function () {
    if ($scope.auth.info.accountName) {
      return $scope.auth.info.accountName;
    }

    if ($scope.auth.info.oidc_email) {
      return $scope.auth.info.oidc_email;
    }

    if ($scope.auth.info.oidc_name) {
      return $scope.auth.info.oidc_name;
    }

    return null;
  }

  $scope.isMenuActive = false;
  $scope.isAccountMenuActive = false;

  // Coookieees
  $scope.giveCookieConsent = function () {
    window.localStorage.setItem($scope.databusCookieConsentKey, true);
    $scope.showCookieDialogue = false;
  }

  // Login function
  $scope.login = function () {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  // Logout function
  $scope.logout = function () {
    $scope.hideAccountMenu();
    window.location = '/app/logout?redirectUrl=' + encodeURIComponent(window.location);
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

module.exports = HeaderController;
