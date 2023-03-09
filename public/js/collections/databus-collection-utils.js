class DatabusCollectionUtils {

  static checkCollectionForm(form, collection) {

    var hasError = false;

    if (!this.checkLabel(collection.label, 1, 200)) {
      hasError = true;
      if (collection.label == undefined || collection.label == "") {
        form.label.error = DatabusResponse.COLLECTION_MISSING_LABEL;
      } else {
        form.label.error = DatabusResponse.COLLECTION_INVALID_LABEL;
      }
    } else {
      form.label.error = null;
    }

    if (!this.checkText(collection.description, 50, 0)) {
      hasError = true;
      if (collection.description == undefined || collection.description == "") {
        form.description.error = DatabusResponse.COLLECTION_MISSING_DESCRIPTION;
      } else {
        form.description.error = DatabusResponse.COLLECTION_INVALID_DESCRIPTION;
      }
    } else {
      form.description.error = null;
    }

    return !hasError;
  }




  static checkIdentifier(identifier) {
    var identifierRegex = /^[a-z0-9_-]+$/;
    return this.checkField(identifier, identifierRegex, 1, 50);
  }

  static checkText(value, min, max) {
    var textRegex = /^[\x00-\xFF\n]*$/;
    return this.checkField(value, textRegex, min, max);
  }

  static checkLabel(value, min, max) {
    var labelRegex = /^[A-Za-z0-9\s_()\.\,\-]*$/;
    return this.checkField(value, labelRegex, min, max);
  }

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


  // Checks whether a collection can be saved
  static checkCollectionTexts(collection) {
    var labelReg = /^[\x00-\x7F]*$/;
    var textReg = /^[\x00-\x7F\n]*$/;

    if (collection.label == undefined || collection.label == "") {
      return DatabusResponse.COLLECTION_MISSING_LABEL;
    }

    if (!labelReg.test(collection.label) || collection.label.length > 200) {
      return DatabusResponse.COLLECTION_INVALID_LABEL;
    }

    if (collection.description == undefined || collection.description == "") {
      return DatabusResponse.COLLECTION_MISSING_DESCRIPTION;
    }

    if (!textReg.test(collection.description) || description.description.length < 50) {
      return DatabusResponse.COLLECTION_INVALID_DESCRIPTION;
    }

    return 0;
  }


  // Creates a v4 uuid
  static uuidv4() {
    return '___xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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

  static createQueryString(collection) {
    var wrapper = new DatabusCollectionWrapper(collection);
    return wrapper.createQuery();
  }

  static reduceBinding(binding) {
    for (var key in binding) {
      binding[key] = binding[key].value;
    }

    return binding;
  }

  static async getCollectionStatistics($http, collection) {

    var query = QueryBuilder.build({
      node : collection.content.root,
      resourceBaseUrl : DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.COLLECTION_STATISTICS_TEMPLATE
    });

    if (query == null) return null;
    
    var req = {
      method: 'POST',
      url: DATABUS_SPARQL_ENDPOINT_URL,
      data: "format=json&query=" + encodeURIComponent(query),
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
    }

    var response = await $http(req);
    var entries = response.data.results.bindings;

    entries = entries.filter(function(e) {
      return e.file != undefined;
    });

    if (entries.length === 0) {
      return null;
    }


    let result = {
      fileCount: entries.length,
      licenses: [],
      files: [],
      size: 0
    };

    for (let i in entries) {
      let element = DatabusCollectionUtils.reduceBinding(entries[i]);

      result.size += parseInt(element.size);
      result.licenses.push(element.license);
      result.files.push(element);
    }

    result.licenses = result.licenses.filter(function (item, pos, self) {
      return self.indexOf(item) === pos;
    });

    return result;
  }

  static async getCollectionFiles($http, collection) {

    if(!collection.hasContent) {
      return [];
    }
    
    let query = QueryBuilder.build({
      node : collection.content.root,
      resourceBaseUrl : DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.COLLECTION_FILES_TEMPLATE
    });

    var req = {
      method: 'POST',
      url: DATABUS_SPARQL_ENDPOINT_URL,
      data: "format=json&query=" + encodeURIComponent(query),
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
    }

    var response = await $http(req);
    var entries = response.data.results.bindings;

    if (entries.length === 0) {
      return null;
    }

    let result = [];
    
    for (let i in entries) {
      let element = DatabusCollectionUtils.reduceBinding(entries[i]);
      result.push(element);
    }

    return result;
  }

  static async getCollectionFileURLs($http, collection) {

    let query = QueryBuilder.build({
      node : collection.content.root,
      resourceBaseUrl : DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.DEFAULT_FILE_TEMPLATE
    });

    var req = {
      method: 'POST',
      url: DATABUS_SPARQL_ENDPOINT_URL,
      data: "format=json&query=" + encodeURIComponent(query),
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
    }

    var response = await $http(req);
    var entries = response.data.results.bindings;

    if (entries.length === 0) {
      return null;
    }

    let result = "";
    
    for (let i in entries) {
      let element = DatabusCollectionUtils.reduceBinding(entries[i]);
      console.log(element);
      result += element.file + '\n';
    }

    return result;
  }


  /*
  static copyData(data) {
    return JSON.parse(JSON.stringify(data));
  }*/

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

  static cyrb53Hash (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };

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
  module.exports = DatabusCollectionUtils;
