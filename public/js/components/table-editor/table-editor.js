
// hinzufügen eines Controllers zum Modul
function TableEditorController() {

  var ctrl = this;

  ctrl.$onInit = function() {

    ctrl.selection = {};
    ctrl.edit = {};

    if(ctrl.model.groupMode == undefined) {
      ctrl.model.groupMode = true;
    }


   
    ctrl.setupColumns();
    ctrl.updateViewModel();
  }

  ctrl.setupColumns = function() {

    ctrl.columns = [];
    ctrl.columns.push({ title:'File', width: 280, isReadonly : true });
    ctrl.columns.push({ title:'Format', width: 75, isReadonly : true });
    ctrl.columns.push({ title:'Compression', width: 115, isReadonly : true });

    for(var c in ctrl.model.contentVariants) {
      var cv = ctrl.model.contentVariants[c];
      ctrl.columns.push({ title: cv.label, width: 120, isReadonly : false });
    }


    ctrl.columns.push({ title:'Size', width: 115, isReadonly : true });
    ctrl.columns.push({ title:'Shasum', width: 200, isReadonly : true });
    ctrl.columns.push({ title:'Actions', width: 140, isReadonly : true });

    ctrl.progressWidth = (115 + 200) + 'px';

  }

  ctrl.toggleGroupMode = function() {
    ctrl.model.groupMode = ! ctrl.model.groupMode;
    ctrl.updateViewModel();
  }

  ctrl.onShowInput = function($event) {
   
  }

  ctrl.deselect = function() {
    ctrl.edit.x = undefined;
    ctrl.edit.y = undefined;
    ctrl.selection.x = undefined;
    ctrl.selection.y = undefined;
    ctrl.selection.width = 0;
    ctrl.selection.height = 0;
  }

  ctrl.selectCell = function($event, x, y) {

    if(ctrl.selection.x == x && ctrl.selection.y == y) {
      ctrl.edit.x = x;
      ctrl.edit.y = y; 

      // $event.target.setSelectionRange(0, $event.target.value.length)
      // $event.target.selectionStart = 0;
      // $event.target.selectionEnd = $event.target.value.length;
      return;
    }

    ctrl.edit.x = undefined;
    ctrl.edit.y = undefined;
    ctrl.selection.x = x;
    ctrl.selection.y = y;
    ctrl.selection.width = 1;
    ctrl.selection.height = 1;
   
  }

  ctrl.analyzeFile = function(file) {
    ctrl.onAnalyzeFile({ file : file });
  }

  ctrl.onChangeCv = function(file, cv) {

    var index = ctrl.model.files.findIndex(f => f.uri == file.uri);
    
    for(var i = index + 1; i < index + file.rowspan; i++) {
      ctrl.model.files[i].contentVariants[cv.label] = file.contentVariants[cv.label];
    }
    
    ctrl.model.isConfigDirty = true
  }

  ctrl.updateViewModel = function() {


    for(var f in ctrl.model.files) {
      ctrl.model.files[f].rowspan = 1;
    }

    if(ctrl.model.groupMode) {

      var i = 0;
      var step = 1;

      while(i + step < ctrl.model.files.length) {

        if(ctrl.model.files[i].name == ctrl.model.files[i + step].name) {
          // Swallow the cv setting of the next row
          ctrl.model.files[i].rowspan++;
          ctrl.model.files[i + step].rowspan = 0;

          for(var c in ctrl.model.contentVariants) {
            var cv = ctrl.model.contentVariants[c];
            ctrl.model.files[i + step].contentVariants[cv.label] = ctrl.model.files[i].contentVariants[cv.label];
          }

          step++;
        } else {
          i += step;
          step = 1;
        }
      }
    }


  }
  /**
   * Removes a specific distribution from an artifact
   * @param {*} artifact 
   * @param {*} file 
   */
  ctrl.removeFileFromArtifact = function(file) {
    ctrl.onRemoveFile({ file : file });
  }

  ctrl.$doCheck = function() { 

    var numFiles = DatabusUtils.objSize(ctrl.model.files);
    if(ctrl.numFiles != numFiles) {
      ctrl.updateViewModel();
      ctrl.numFiles = numFiles;
    }


    if(ctrl.columns == undefined) {
      return;
    }

    var columnCount = 6;

    for(var c in ctrl.model.contentVariants) {
      columnCount++;
    }

    ctrl.progressPosition = 45;
    for(var i = 0; i < columnCount - 3; i++) {
      ctrl.progressPosition += ctrl.columns[i].width;
    }
    ctrl.progressPosition = ctrl.progressPosition + 'px'

    if(ctrl.columns.length == columnCount) {
      return;
    }

    ctrl.setupColumns();
  }

  ctrl.change = function() {

  }
}

