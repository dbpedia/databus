// hinzufügen eines Controllers zum Modul
function FileBrowserController($http, $scope) {

  var ctrl = this;

  ctrl.$http = $http;
  ctrl.activeTab = 0;
  ctrl.$scope = $scope;

  ctrl.$onInit = function() {

    ctrl.lastRequestRevision = 0;
    ctrl.tableLimit = 20;
    ctrl.sortProperty = 'version.value';
    ctrl.sortReverse = false;
    ctrl.queryResult = {};
  }

  ctrl.sortBy = function(property) {


    if(ctrl.sortProperty == property) {
      ctrl.sortReverse = !ctrl.sortReverse;
    }
    ctrl.sortProperty = property;
  }

  ctrl.getCellValues = function(binding, column) {

    if(binding[column.field] == undefined) {
      return "";
    }
    
    var value = binding[column.field].value;

    if(column.uriToName) {
      value = DatabusCollectionUtils.uriToName(value);
    }


    return value;

  }

  ctrl.formatUploadSize = function(size) {
    return DatabusUtils.formatFileSize(size);
  };

  ctrl.createRelativeUri = function(url) {
    var u = new URL(url);
    return u.pathname;
  }

  ctrl.formatVariant = function(value) {
    var variants = value.split(', ');
    value = "";
    for(variant of variants) {
      if(variant != undefined && variant != "") {
        value += variant + ", ";
      }
    }

    if(value == "") {
      return "---";
    }

    return value.substr(0, value.length - 2);
  }

  ctrl.querySparql = async function(query) {

    ctrl.isLoading = true;
    ctrl.totalSize = 0;
    ctrl.numFiles = 0;

    try {

      var req = {
        method: 'POST',
        url: DATABUS_SPARQL_ENDPOINT_URL,
        data: "format=json&query=" + encodeURIComponent(query),
        headers: {
          "Content-type" : "application/x-www-form-urlencoded"
        },
      }

      var updateResponse = await ctrl.$http(req); 

      var data = updateResponse.data;

      ctrl.isLoading = false;


      ctrl.queryResult.bindings = data.results.bindings;

      ctrl.queryResult.uriList = "";

      for(var b in ctrl.queryResult.bindings) {
        var binding = ctrl.queryResult.bindings[b];
        binding.size.numericalValue = parseInt(binding.size.value);
        ctrl.queryResult.uriList += binding.file.value + "\n";

        if(binding.variant != undefined) {
          binding.variant.value = ctrl.formatVariant(binding.variant.value);          
        }
        
     


        ctrl.totalSize += binding.size.numericalValue;
        ctrl.numFiles++;
      }

      ctrl.totalSize = ctrl.formatUploadSize(ctrl.totalSize);
      
      if(!$scope.$root.$$phase) {
        ctrl.$scope.$apply();
      }

    } catch(e) {
      console.log(e);
    }
    /*
    var url = "https://databus.dbpedia.org/repo/sparql";
    var queryUrl = url + "?query=" + encodeURIComponent(query);
    var requestRevision = this.lastRequestRevision;

    $.ajax({
       url: queryUrl,
       data: {
           format: 'json'
       },
       error: function() {
         alert("error");
       },
       dataType: 'jsonp',
       success: function(data) {


         
       },
       type: 'GET'
    });*/
  }

  /**
   * On each digest, check whether the settings array has changed, if so create new QUERIES
   * using the query builders
   * @return {[type]} [description]
   */
  ctrl.$doCheck = function() {

    if(ctrl.query != ctrl.fileQuery) {
      ctrl.fileQuery = ctrl.query;
      ctrl.querySparql(ctrl.fullQuery);
    }
    /* q
    if(ctrl.previousLength == undefined || Object.keys(ctrl.facetSettings).length != ctrl.previousLength) {
      ctrl.previousLength =  Object.keys(ctrl.facetSettings).length;

      
      ctrl.fileQuery = ctrl.fileQueryBuilder.createArtifactQuery(ctrl.resourceUri, ctrl.parentFacetSettings, ctrl.facetSettings);

      var query = ctrl.fullQueryBuilder.createArtifactQuery(ctrl.resourceUri, ctrl.parentFacetSettings, ctrl.facetSettings);
      ctrl.querySparql(query);
    }*/
  }
}



