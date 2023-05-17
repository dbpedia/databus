
class DatabusAlert {
  static alert($scope, isSuccess, message, ms) {
    if(ms == undefined) {
      ms = 3000; 
    }
    $scope.$broadcast('onDatabusAlert', { isSuccess: isSuccess, message: message, ms: ms});
  }

  static alertCode($scope, code, ms) {
    if(ms == undefined) {
      ms = 3000; 
    }

    var isSuccess = code >= 200 && code < 400;
    $scope.$broadcast('onDatabusAlert', { isSuccess: isSuccess, message: message, ms: ms});
  }
}

// hinzufügen eines Controllers zum Modul
function DatabusAlertController($scope, $timeout) {

  var ctrl = this;

  $scope.$on('onDatabusAlert', function(e, data) {
    ctrl.isSuccess = data.isSuccess;
    ctrl.message = data.message;
    ctrl.isVisible = false;

    if(ctrl.hidePromise != null) {
      $timeout.cancel(ctrl.hidePromise);
    }

    $timeout(function() {
      ctrl.isVisible = true;
    }, 0);

    ctrl.hidePromise = $timeout(function() {
      ctrl.isVisible = false;
    }, data.ms);
  });

  ctrl.$onInit = function() {

  }

  ctrl.isSuccess = function() {
    return ctrl.isSuccess;
  }

  ctrl.$doCheck = function() {
    
  }
}

if (typeof module === "object" && module && module.exports)
  module.exports = DatabusAlert;
