// hinzufügen eines Controllers zum Modul
function MultiselectDropdownController($timeout, $sce) {

  var ctrl = this;
  ctrl.$sce = $sce;
  ctrl.searchInput = "";


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

  ctrl.valueComparator = function(v1, v2) {
    var isV1Included = ctrl.includesValue(ctrl.input, v1.value) 
      || ctrl.includesValue(ctrl.parentInput, v1.value);
    var isV2Included = ctrl.includesValue(ctrl.input, v2.value) 
    || ctrl.includesValue(ctrl.parentInput, v2.value);

    if(isV1Included != isV2Included) {
      return isV1Included ? -1 : 1;
    }

    if(v1.value == "None") {
      return -1;
    }


    if(v2.value == "None") {
      return 1;
    }

    return v1.value.localeCompare(v2.value);
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

    var allEntries = Object.keys(mergedSettings).map(function (key, index) {


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
    });


    var list = [];
    var maxLength = 50;
    var length = 0;
    var hasOverflow = false;

    for(var entry of allEntries) {
      if(entry.length + length > maxLength) {
        hasOverflow = true;
        break;
      }

      length += entry.length;
      list.push(entry);
    }

    if(hasOverflow) {
      list.push('...');
    }
    
    return ctrl.$sce.trustAsHtml(list.join(', '));
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

  ctrl.matchesSearch = function(value) {
    return value.includes(ctrl.searchInput);
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


module.exports = MultiselectDropdownController;