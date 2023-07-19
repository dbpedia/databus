const DatabusCollectionUtils = require("../collections/databus-collection-utils");
var markdownit = require('markdown-it');
const moment = require("moment/moment");
const DatabusUris = require("./databus-uris");

class DatabusUtils {

  static stringOrFallback(value, fallback) {
    if (value != null && value.length > 0) {
      return value;
    }

    return fallback;
  }

  static isValidResourceIdentifier(identifier, min) {
    var identifierRegex = /^[a-z-]+$/;
    return this.checkField(identifier, identifierRegex, min, 50);
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

  static isValidVersionIdentifier(identifier) {
    var labelRegex = /^[A-Za-z0-9_\.\-]*$/;
    return this.checkField(identifier, labelRegex, 3, 50);
  }

  static isValidResourceText(value, min, max) {
    var textRegex = /^[\x00-\x7F\n]*$/;
    return this.checkField(value, textRegex, min, max);
  }

  static isValidAccountName(identifier) {
    var labelRegex = /^[a-z][0-9a-z_\-]+[0-9a-z]$/;
    return this.checkField(identifier, labelRegex, 3, 15);
  }

  static timeStringNow() {
    return new Date(Date.now()).toISOString();
  }

  static isValidGroupName(name) {
    var labelRegex = /[a-zA-Z0-9_\-\.]{3,50}$/;
    return this.checkField(name, labelRegex, 3, 50);
  }

  static isValidArtifactName(name) {
    var labelRegex = /[a-zA-Z0-9_\-\.]{3,50}$/;
    return this.checkField(name, labelRegex, 3, 50);
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

  static uriToTitle(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);
    result = result.substr(result.lastIndexOf('#') + 1);

    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  static uriToName(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);
    result = result.substr(result.lastIndexOf('#') + 1);

    if (result.includes('.')) {
      result = result.substr(0, result.lastIndexOf('.'));
    }

    return result;
  }

  static uriToResourceName(uri) {
    if (uri == null) {
      return null;
    }

    var result = uri.substr(uri.lastIndexOf('/') + 1);

    if(result.includes('#')) {
      result = result.substr(0, result.indexOf('#'));
    }

    return result;
  }

  static isValidHttpUrl(string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  static isValidHttpsUrl(string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "https:";
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

  static lineCount(text) {
    return (text.match(/^\s*\S/gm) || "").length
  }


  static getResourcePathLength(uri) {
    var parts = DatabusUtils.splitResourceUri(uri);

    if (parts.length == 1 && parts[0] == "") {
      return 0;
    }

    return parts.length;
  }

  static splitResourceUri(uri) {

    var url = new URL(uri);
    uri = url.pathname;

    if (uri.startsWith('/')) {
      uri = uri.substr(1);
    }
    if (uri.endsWith('/')) {
      uri = uri.substr(0, uri.length - 1);
    }

    return uri.split('/');
  }

  static formatDate(date) {
    return moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
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

  static async parseN3(data, maxQuads) {
    return new Promise((resolve, reject) => {

      const quads = [];
      const prefixes = [];

      const parser = new N3.Parser();

      parser.parse(data, (e, q, p) => {
        if (e) {
          reject(e);
          return;
        }

        if (quads.length > maxQuads || q == null) {
          resolve({ quads: quads, prefixes: prefixes });
        }

        if (q) {
          quads.push(q);
        }
      });
    });
  }

  static async parseDatabusManifest(data) {

    var parsedData = await DatabusUtils.parseN3(data, 100);

    for (var quad of parsedData.quads) {

      if (quad.predicate.id == `http://www.w3.org/1999/02/22-rdf-syntax-ns#type`
        && quad.object.id == DatabusUris.DATABUS_DATABUS) {

        return {
          uri: quad.subject.id
        }
      }
    }

    return undefined;
  }

  static parseMarkdown(markdown) {

    if(markdown == null) {
      return null;
    }

    var markdownParser = markdownit();
    return markdownParser.parse(markdown);
  }

  static renderMarkdown(markdown) {

    if(markdown == null) {
      return null;
    }

    var markdownParser = markdownit();
    return markdownParser.render(markdown);
  }

  /**
   * Create a dct:abstract from the content of a dct:description
   * @param {*} description 
   */
  static createAbstractFromDescription(description) {

    if(description == null) {
      return null;
    }

    try {
      var tokens = this.parseMarkdown(description);

     
      var paragraphFound = false;
      var result = "";

      if(tokens == null) {
       return result; 
      }

      var firstParagraphText = null;

      for (var i = 0; i < tokens.length; i++) {

        var token = tokens[i];
        var appendText = null;

        if (token.type == 'inline' && tokens[i - 1].type == 'paragraph_open' && token.level == 1) {
          result = token.content;
          break;
        }

      }

      return result;

    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  /**
   * Find groups files that are not distinguishable
   * @param {Array of file URIs} files 
   * @param {Array of content variant names} contentVariants 
   * @param {Index in the array of content variants} index 
   * @returns 
   */
  static cvSplit(distributionGraphs, contentVariantUris, contentVariantIndex) {

    var errorList = [];

    if (distributionGraphs.length <= 1) {
      return errorList;
    }

    if (contentVariantIndex >= contentVariantUris.length) {

      // Check buckets for double entries if (files.length > 1) {
      if (distributionGraphs.length > 1) {

        var error = {};
        error.downloadURLs = [];

        for (var distribution of distributionGraphs) {

          error.downloadURLs.push(distribution[DatabusUris.DCAT_DOWNLOAD_URL][0][DatabusUris.JSONLD_ID]);
        }

        error[DatabusUris.DATABUS_FORMAT_EXTENSION] =
          distributionGraphs[0][DatabusUris.DATABUS_FORMAT_EXTENSION][0][DatabusUris.JSONLD_VALUE];

        error[DatabusUris.DATABUS_COMPRESSION] =
          distributionGraphs[0][DatabusUris.DATABUS_COMPRESSION][0][DatabusUris.JSONLD_VALUE];

        for (var contentVariantUri of contentVariantUris) {
          error[contentVariantUri] = distributionGraphs[0][contentVariantUri] != null ?
            distributionGraphs[0][contentVariantUri][0][DatabusUris.JSONLD_VALUE] : 'none'
        }

        errorList.push(error);
      }
    } else {

      var contentVariantUri = contentVariantUris[contentVariantIndex];

      // else create buckets and sort files into buckets
      var buckets = {};

      for (var distribution of distributionGraphs) {

        var variantValue = distribution[contentVariantUri];

        if (variantValue != undefined) {
          variantValue = variantValue[0]['@value'];
        }

        if (variantValue == undefined || variantValue == '') {
          variantValue = '$_none$';
        }

        if (buckets[variantValue] == undefined) {
          buckets[variantValue] = [];
        }

        buckets[variantValue].push(distribution);
      }


      // iterate buckets and call recursively
      for (var b in buckets) {

        for (var error of DatabusUtils.cvSplit(buckets[b],
          contentVariantUris, contentVariantIndex + 1, errorList)) {
          errorList.push(error);
        }
      }
    }

    return errorList;
  }

}

// export default DatabusUtils;

module.exports = DatabusUtils;
