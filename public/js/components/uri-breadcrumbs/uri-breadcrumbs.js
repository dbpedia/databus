// hinzufügen eines Controllers zum Modul
// TODO update base
function UriBreadcrumbsController() {

  var ctrl = this;

  ctrl.$onInit = function() {

    ctrl.entries = [];

    var uri = ctrl.uri;

    if(uri == undefined || uri == null) {
      return;
    }

    var url = new URL(uri);

    var extensions = url.pathname.split('/');
    var pathSoFar = '';

    for(var e in extensions) {
      var extension = extensions[e];

      if(extension == '') {
        continue;
      }

      pathSoFar += extension + "/";

      ctrl.entries.push({
        label: extension,
        uri: '/' + pathSoFar
      });
    }
  }
}

module.exports = UriBreadcrumbsController;

