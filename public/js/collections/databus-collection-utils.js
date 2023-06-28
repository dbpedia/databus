const QueryBuilder = require("../query-builder/query-builder");
const QueryTemplates = require("../query-builder/query-templates");
const DatabusConstants = require("../utils/databus-constants");
const DatabusMessages = require("../utils/databus-messages");
const DatabusUtils = require("../utils/databus-utils");

class DatabusCollectionUtils {

  static CEDIT_IDENTIFIER_REGEX = /^[a-z0-9_-]{3,50}$/;
  static CEDIT_TITLE_REGEX = /^[A-Za-z0-9\s_()\.\,\-]{3,200}$/;
  static CEDIT_ABSTRACT_REGEX = /^[\x00-\xFF\n]{10,}$/;
  static CEDIT_DESCRIPTION_REGEX = /^[\x00-\xFF\n]{10,}$/;

  static formatMessageWithRegex(message, regex) {
    var regexString = regex.source;
    return message.replace("#REGEX#", regexString);
  }

  static checkCollectionForm(form, collection) {

    var hasError = false;

    form.identifier.error = null;
    form.title.error = null;
    form.abstract.error = null;
    form.description.error = null;

    if (collection.isDraft) {

      // Check the identifier
      if (!this.CEDIT_IDENTIFIER_REGEX.test(form.identifier.value)) {
        hasError = true;
        form.identifier.error = this.formatMessageWithRegex(
          DatabusMessages.CEDIT_INVALID_IDENTIFIER,
          this.CEDIT_IDENTIFIER_REGEX
        );
      }
    }

    // Check the title
    if (!this.CEDIT_TITLE_REGEX.test(collection.title)) {
      hasError = true;
      form.title.error = this.formatMessageWithRegex(
        DatabusMessages.CEDIT_INVALID_TITLE,
        this.CEDIT_TITLE_REGEX
      );
    }

    // Check the abstract
    if (!this.CEDIT_ABSTRACT_REGEX.test(collection.abstract)) {
      hasError = true;
      form.abstract.error = this.formatMessageWithRegex(
        DatabusMessages.CEDIT_INVALID_ABSTRACT,
        this.CEDIT_ABSTRACT_REGEX
      );
    }

    // Check the description
    if (!this.CEDIT_DESCRIPTION_REGEX.test(collection.description)) {
      hasError = true;
      form.description.error = this.formatMessageWithRegex(
        DatabusMessages.CEDIT_INVALID_DESCRIPTION,
        this.CEDIT_DESCRIPTION_REGEX
      );
    }

    return !hasError;
  }




  static checkIdentifier(identifier) {
    var identifierRegex = /^[a-z0-9_-]{3, 50}$/;
    return this.checkField(identifier, identifierRegex, 3, 50);
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


  static formatQuery(query, placeholderMappings) {

    if (placeholderMappings == undefined) {
      return query;
    }

    for (var placeholder in placeholderMappings) {
      var re = new RegExp('%' + placeholder + '%', "g");
      query = query.replace(re, placeholderMappings[placeholder]);
    }

    return query;
  }

  static async getCollectionStatistics($http, collection) {

    var query = QueryBuilder.build({
      node: collection.content.root,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.COLLECTION_STATISTICS_TEMPLATE
    });

    if (query == null) return null;

    var req = {
      method: 'POST',
      url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
      data: "format=json&timeout=1000000&query=" + encodeURIComponent(query),
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
    }

    var response = await $http(req);
    var entries = response.data.results.bindings;

    entries = entries.filter(function (e) {
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

    if (!collection.hasContent) {
      return [];
    }

    let query = QueryBuilder.build({
      node: collection.content.root,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.DISTRIBUTIONS_TEMPLATE
    });

    var req = {
      method: 'POST',
      url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
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

    var distributions = {};
    var bindings = [];

    for (var entry of entries) {
      var uri = entry.distribution.value;
      var databusUri = DatabusCollectionUtils.navigateUp(uri, 4);

      if (distributions[databusUri] == null) {
        distributions[databusUri] = [];
      }

      distributions[databusUri].push(`<${uri}>`);
    }

    for (var databusUri in distributions) {

      var distributionsString = distributions[databusUri].join('\n');

      var params = {};
      params.DISTRIBUTIONS = distributionsString;

      let fileQuery = DatabusCollectionUtils.formatQuery(QueryTemplates.COLLECTION_TABLE_QUERY, params);

      var req = {
        method: 'POST',
        url: `${databusUri}${DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL}`,
        data: "format=json&query=" + encodeURIComponent(fileQuery),
        headers: {
          "Content-type": "application/x-www-form-urlencoded"
        },
      }

      response = await $http(req);

      for(var binding of response.data.results.bindings) {
        binding.databus = databusUri;

        
        bindings.push(binding);
      }

    }


    // Postproccess

    let result = [];

    for(var binding of bindings) {
      binding = DatabusCollectionUtils.reduceBinding(binding);

      var variant = binding.variant;
        var variants = variant.split(',');

        var cleanedVariants = [];

        for(var v of variants) {
          if(v != "" && v != " ") {
            cleanedVariants.push(v);
          }
        }

        binding.variant = cleanedVariants.join(",");

      result.push(binding);
    }


    /*
    for (var entry of entries) {

      try {
        console.log(entry.distribution.value);

        var params = {};
        params.DISTRIBUTION = entry.distribution.value;

        let fileQuery = DatabusUtils.formatQuery(QueryTemplates.COLLECTION_TABLE_ROW_QUERY, params);

        var req = {
          method: 'POST',
          url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
          data: "format=json&query=" + encodeURIComponent(fileQuery),
          headers: {
            "Content-type": "application/x-www-form-urlencoded"
          },
        }

        response = await $http(req);

        if (response.data.results.bindings.length === 0) {
          continue;
        }

        result.push(DatabusCollectionUtils.reduceBinding(response.data.results.bindings[0]));

      } catch(err) {
        console.log(err);
      }
    }

    // Postprocess:



    for (let i in entries) {
      let element = DatabusCollectionUtils.reduceBinding(entries[i]);
      result.push(element);
    }
    */

    return result;
  }



  static navigateUp(uri, steps) {

    if (steps == undefined) {
      steps = 1;
    }

    for (var i = 0; i < steps; i++) {
      uri = uri.substr(0, uri.lastIndexOf('/'));
    }

    if (uri.includes('#')) {
      uri = uri.substr(0, uri.lastIndexOf('#'));
    }

    return uri;
  }

  static async getCollectionFileURLs($http, collection) {

    let query = QueryBuilder.build({
      node: collection.content.root,
      resourceBaseUrl: DATABUS_RESOURCE_BASE_URL,
      template: QueryTemplates.DEFAULT_FILE_TEMPLATE
    });

    var req = {
      method: 'POST',
      url: DatabusConstants.DATABUS_SPARQL_ENDPOINT_URL,
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

  static cyrb53Hash(str, seed = 0) {
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

module.exports = DatabusCollectionUtils;
