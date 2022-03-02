// hinzufügen eines Controllers zum Modul
function MultiselectDropdownController($timeout, $sce) {

  var ctrl = this;
  ctrl.$sce = $sce;

  ctrl.$onInit = function () {

  }

  ctrl.handleKey = function (e) {
    if (e.which === 9 || e.which === 13) {
      ctrl.showDrop = false;
    }
  }

  ctrl.getLabel = function (value) {

    if (value == '$latest') {
      return 'Latest Version';
    }

    if (value == '') {
      return 'None';
    }

    return value;
  }

  ctrl.hasContent = function () {
    return !((ctrl.input == undefined || ctrl.input.length == 0) && (ctrl.parentInput == undefined ||
      ctrl.parentInput.length == 0));
  }

  ctrl.mergeSettings = function (parentSettings, childSettings) {
    var mergedSettings = {};

    // Set parent settings state
    if (parentSettings != undefined) {
      for (var setting of parentSettings) {
        mergedSettings[setting.value] = setting.checked;
      }
    }

    // Override with child settings
    for (var s in childSettings) {
      var setting = childSettings[s];
      mergedSettings[setting.value] = setting.checked;
    }

    return mergedSettings;
  }

  ctrl.list = function () {

    var mergedSettings = ctrl.mergeSettings(ctrl.parentInput, ctrl.input);

    return ctrl.$sce.trustAsHtml(Object.keys(mergedSettings).map(function (key, index) {

      var label = undefined;

      if (key == '') {
        label = '<i style="color: #a3a3a3;">None</i>';
      } else {
        label = ctrl.getLabel(key);
      }

      if (mergedSettings[key]) {
        return label;
      } else {
        return `<s>${label}</s>`;
      }
    }).join(', '));


  }


  ctrl.hideDropDelayed = function () {
    $timeout(function () {
      ctrl.showDrop = false;
    }, 120);
  }

  ctrl.includesValue = function (objs, value) {
    if (objs == undefined) {
      return false;
    }

    for (var obj of objs) {
      if (obj.value == value) {
        return true;
      }
    }

    return false;
  }

  ctrl.isChecked = function (objs, value) {
    if (objs == undefined) {
      return false;
    }

    for (var obj of objs) {
      if (obj.value == value) {
        return obj.checked;
      }
    }

    return false;
  }

  ctrl.veryStupidDelete = function (objs, value) {

    let index = -1;
    let k = 0;

    if (objs == undefined) {
      return false;
    }

    for (var obj of objs) {
      if (obj.value == value) {
        index = k;
        break;
      }

      k++;
    }

    objs.splice(k, 1);
  }

  ctrl.toggle = function (value) {

    if (ctrl.input == undefined) {
      ctrl.input = [];
    }

    var isSetByParent = ctrl.parentInput != undefined && ctrl.includesValue(ctrl.parentInput, value);

    if (!ctrl.includesValue(ctrl.input, value)) {
      ctrl.input.push({ value: value, checked: !isSetByParent });

    } else {

      ctrl.veryStupidDelete(ctrl.input, value);
    }

    ctrl.change();
  }


  ctrl.change = function () {
    $timeout(function () {
      ctrl.onChange();
    }, 50);;
  }
}

