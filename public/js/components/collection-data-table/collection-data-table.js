const DatabusCollectionUtils = require("../../collections/databus-collection-utils");
const DatabusUtils = require("../../utils/databus-utils");


// hinzufügen eines Controllers zum Modul
function CollectionDataTableController($http, $scope, $location, $sce) {

  var ctrl = this;
  ctrl.$http = $http;


  ctrl.$onInit = function() {


    ctrl.isLoading = true;
    DatabusCollectionUtils.getCollectionFiles(ctrl.$http, ctrl.collection).then(function(result) {
      ctrl.files = result;
      ctrl.isLoading = false;
      $scope.$apply();
    }, function(err) {
      ctrl.statistics = null;
      ctrl.isLoading = false;
    });


    if(ctrl.files == null) {
      return;
    }

    ctrl.groupedFiles = ctrl.groupBy(ctrl.files, 'version');
  }

  ctrl.getRowspan = function(file) {

    return file.distributions.length * 2; 
    /*
    var span = file.distributions.length * 2;
    if(!file.distributions[file.distributions.length - 1].expanded) {
      span--;
    }

    return span;*/
  }

  ctrl.groupBy = function(list, key) {

    var result = {};

    for(var i in list) {
      var element = list[i];
      var keyVal = element[key];

      if(result[keyVal] == undefined) {
        result[keyVal] = {}
        result[keyVal].value = keyVal;
        result[keyVal].title = element.title;
        result[keyVal].uri = keyVal;
        result[keyVal].distributions = [];
        result[keyVal].license = element.license;
      }

      result[keyVal].distributions.push(element);
    }
    
    return result;
  }

  ctrl.calculateRowSpan = function(file) {
    var rowspan = 0;

    for(var d in file.distributions) {
      rowspan += 1; //(file.distributions[d].expanded ? 2 : 1);
    }

    return rowspan;
  }

  ctrl.createRelativeUri = function(url) {
    var u = new URL(url);
    return u.pathname;
  }

  ctrl.$doCheck = function() {

    if(ctrl.files == null) {
      return;
    }

    if(ctrl.previousFileCount != ctrl.files.length) {
      ctrl.previousFileCount = ctrl.files.length;
      ctrl.groupedFiles = ctrl.groupBy(ctrl.files, 'version');
    }  
  }

  ctrl.uriToName = function(uri) {
    return DatabusUtils.uriToName(uri);
  }

  ctrl.formatUploadSize = function(size) {
    if(size < 1024) return size + " B";
    else if (size < 1048576) return Math.round(size / 1024) + " KB";
    else if (size < 1073741824) return (Math.round(10 * size / 1048576) / 10) + " MB";
    else return (Math.round(100 * size / 1073741824) / 100) + " GB";
  }
}


module.exports = CollectionDataTableController;