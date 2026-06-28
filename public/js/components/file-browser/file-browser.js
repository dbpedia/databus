const DatabusConstants = require("../../utils/databus-constants");
const DatabusUtils = require("../../utils/databus-utils");
// hinzufügen eines Controllers zum Modul
function FileBrowserController($http, $scope) {

  var ctrl = this;

  ctrl.$http = $http;
  ctrl.activeTab = 0;
  ctrl.$scope = $scope;

  ctrl.$onInit = function () {

    ctrl.lastRequestRevision = 0;
    ctrl.tableLimit = 20;
    ctrl.sortProperty = 'version.value';
    ctrl.sortReverse = false;
    ctrl.isLoading = true;
    ctrl.queryResult = {};
  }

  ctrl.loadPreview = async function (binding) {
    binding.preview = { state: 'loading', value: null };

    try {
      const params = new URLSearchParams({
        url: binding.file.value,
        compression: binding.compression?.value || ''
      });

      const res = await fetch('/app/file/preview?' + params.toString(), {
        credentials: 'same-origin'
      });

      if (!res.ok) throw new Error('Network error');

      const data = await res.json();
      if (data.preview != null) {
        binding.preview.state = 'success';
        binding.preview.value = data.preview;
      } else {
        binding.preview.state = 'error';
        binding.preview.value = 'Preview could not be loaded';
      }

    } catch (e) {
      binding.preview.state = 'error';
      binding.preview.value = 'Preview could not be loaded';
    }

    if (!ctrl.$scope.$root.$$phase) ctrl.$scope.$apply();
  };

  ctrl.sortBy = function (property) {


    if (ctrl.sortProperty == property) {
      ctrl.sortReverse = !ctrl.sortReverse;
    }
    ctrl.sortProperty = property;
  }

  ctrl.getCellValues = function (binding, column) {

    if (binding[column.field] == undefined) {
      return "";
    }

    var value = binding[column.field].value;

    if (column.uriToName) {
      value = DatabusUtils.uriToName(value);
    }


    return value;

  }

  ctrl.formatUploadSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };

  ctrl.createRelativeUri = function (url) {
    var u = new URL(url);
    return u.pathname;
  }

  ctrl.formatVariant = function (value) {
    var variants = value.split(', ');
    value = "";
    for (variant of variants) {
      if (variant != undefined && variant != "") {
        value += variant + ", ";
      }
    }

    if (value == "") {
      return "none";
    }

    return value.substr(0, value.length - 2);
  }

  ctrl.querySparql = async function (query) {

    ctrl.isLoading = true;
    const revision = ++ctrl.lastRequestRevision;

    try {
      const req = {
        method: "POST",
        url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
        data: "format=json&query=" + encodeURIComponent(query),
        headers: {
          "Content-type": "application/x-www-form-urlencoded"
        }
      };

      const updateResponse = await ctrl.$http(req);

      if (revision !== ctrl.lastRequestRevision) {
        return;
      }

      const bindings = updateResponse.data.results.bindings;

      let totalSize = 0;
      let numFiles = 0;
      let uriList = "";

      for (const binding of bindings) {
        binding.size.numericalValue = parseInt(binding.size.value, 10);
        uriList += binding.file.value + "\n";

        if (binding.variant) {
          binding.variant.value = ctrl.formatVariant(binding.variant.value);
        }

        totalSize += binding.size.numericalValue;
        numFiles++;
      }

      ctrl.queryResult.bindings = bindings;
      ctrl.queryResult.uriList = uriList;

      ctrl.totalSize = ctrl.formatUploadSize(totalSize);
      ctrl.numFiles = numFiles;

      ctrl.isLoading = false;

      if (!ctrl.$scope.$root.$$phase) {
        ctrl.$scope.$apply();
      }

    } catch (e) {
      console.error(e);
      ctrl.isLoading = false;
    }
  }

  /**
   * On each digest, check whether the settings array has changed, if so create new QUERIES
   * using the query builders
   * @return {[type]} [description]
   */
  ctrl.$doCheck = function () {

    if (ctrl.query != ctrl.fileQuery) {
      ctrl.fileQuery = ctrl.query;
      ctrl.querySparql(ctrl.fullQuery);
    }
  }

  function decodeBz2(uint8array) {
    try {
      const decompressed = decompress(uint8array);
      return new TextDecoder().decode(decompressed);
    } catch (e) {
      return null;
    }
  }
}



module.exports = FileBrowserController;