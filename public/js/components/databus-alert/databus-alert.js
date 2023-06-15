
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


module.exports = DatabusAlert;
