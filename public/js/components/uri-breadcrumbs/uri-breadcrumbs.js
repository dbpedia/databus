// hinzufügen eines Controllers zum Modul
// TODO update base
function UriBreadcrumbsController() {

  var ctrl = this;

  ctrl.$onInit = function() {

    ctrl.entries = [];

    var uri = ctrl.uri;
    var base = `${DATABUS_RESOURCE_BASE_URL}/`;
    var extensions = uri.replace(base, '').split('/');
    var pathSoFar = '';

    for(var e in extensions) {
      var extension = extensions[e];
      pathSoFar += extension + "/";

      ctrl.entries.push({
        label: extension,
        uri: '/' + pathSoFar
      });
    }
  }
}

