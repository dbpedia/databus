const DatabusWebappUtils = require("../../utils/databus-webapp-utils");

// hinzufügen eines Controllers zum Modul
function AccountHistoryController($http) {

  var ctrl = this;
  ctrl.utils = new DatabusWebappUtils(null, null);

  
  ctrl.$onInit = async function() {

    var result = await $http.get(`/app/account/history?accountName=${ctrl.accountName}`);

    ctrl.results = result.data;
  }
}


module.exports = AccountHistoryController;