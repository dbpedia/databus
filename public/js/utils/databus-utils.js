class DatabusUtils {

  static isValidResourceIdentifier(identifier, min) {
    var identifierRegex = /^[a-z-]+$/;
    return this.checkField(identifier, identifierRegex, min, 50);
  }

  static isValidVersionIdentifier(identifier) {
    var labelRegex = /^[A-Za-z0-9_\-]*$/;
    return this.checkField(identifier, labelRegex, 3, 50);
  }

  static isValidResourceText(value, min, max) {
    var textRegex = /^[\x00-\x7F\n]*$/;
    return this.checkField(value, textRegex, min, max);
  }

  static isValidAccountName(identifier) {
    var labelRegex = /^[a-z][a-z_\-]+[a-z]$/;
    return this.checkField(identifier, labelRegex, 3, 10);
  }

  static isValidUrl(value) {
    var textRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return textRegex.test(value);
  }

  static isValidResourceLabel(value, min, max) {
    var labelRegex = /^[A-Za-z0-9\s_()\.\,\-]*$/;
    return this.checkField(value, labelRegex, min, max);
  }

  static objSize(obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  }

  static uniqueList(arr) {
    var u = {}, a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
      if (!u.hasOwnProperty(arr[i])) {
        a.push(arr[i]);
        u[arr[i]] = 1;
      }
    }
    return a;
  }


  static formatFileSize(size) {
    if (size == undefined) {
      return '0 KB'
    }

    if (size < 1024) return size + " B";
    else if (size < 1048576) return Math.round(size / 1024) + " KB";
    else if (size < 1073741824) return (Math.round(10 * size / 1048576) / 10) + " MB";
    else return (Math.round(100 * size / 1073741824) / 100) + " GB";
  };

  static checkField(value, regex, min, max) {
    if (value == undefined) {
      return false;
    }

    if (max > 0 && value.length > max) {
      return false;
    }

    if (value.length < min) {
      return false;
    }

    return regex.test(value);
  }

  // Creates a v4 uuid
  static uuidv4() {
    return '___xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static tryParseJson(str) {
    return JSON.parse(str);
  }

  static uriToName(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);
    result = result.substr(result.lastIndexOf('#') + 1);
    return result;
  }

  static navigateUp(uri) {
    return uri.substr(0, uri.lastIndexOf('/'));
  }

  static copyStringToClipboard(str) {
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = { position: 'absolute', left: '-9999px' };
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);
  }

  static serialize(collectionObject, ignoreKeys) {

    if (ignoreKeys == undefined) {
      ignoreKeys = [
        'parent',
        '$$hashKey',
        'expanded',
        'files',
        'eventListeners',
        'hasLocalChanges',
        'published'
      ];
    }

    return JSON.stringify(collectionObject, function (key, value) {
      if (ignoreKeys.includes(key)) {
        return undefined;
      }

      return value;
    });
  }

  static createCleanCopy(jsonData) {
    var data = JSON.parse(DatabusCollectionUtils.serialize(jsonData));
    return data;
  }

  static exportToJsonFile(jsonData) {

    var ignoreKeys = [
      'parent',
      '$$hashKey',
      'expanded',
      'files',
      'eventListeners',
      'hasLocalChanges',
      'published',
      'uuid'
    ];

    let dataStr = DatabusCollectionUtils.serialize(jsonData, ignoreKeys);
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

}

if (typeof module === "object" && module && module.exports)
  module.exports = DatabusUtils;
