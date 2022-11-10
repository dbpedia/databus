class DataIdCreator {

  constructor(accountName) {
    this.accountName = accountName;
  }

  createUpdate(data) {
    var group = this.createGroupUpdate(data);
    var dataid = this.createVersionUpdate(data);

    var result = {
      "@context": 'https://downloads.dbpedia.org/databus/context.jsonld',
      "@graph": []
    };

    if (group != undefined) {
      for (var graph of group["@graph"]) {
        result["@graph"].push(graph);
      }
    }

    if (dataid != undefined) {
      for (var graph of dataid["@graph"]) {
        result["@graph"].push(graph);
      }
    }

    return result;
  }

  getValidString(value) {
    if(value == undefined || value.length == 0) {
      return undefined;
    }

    return value;
  }

  createGroupUpdate(data) {

    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountName}`;




    return {
      "@context": 'https://downloads.dbpedia.org/databus/context.jsonld',
      "@graph": [
        {
          "@id": `${accountUri}/${data.group.name}`,
          "@type": "Group",
          "title": this.getValidString(data.group.title),
          "abstract": this.getValidString(data.group.abstract),
          "description": this.getValidString(data.group.description)
        }
      ]
    };
  }

  createVersionUpdate(data) {

    if (data.group.publishGroupOnly) {
      return undefined;
    }

    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountName}`;
    var groupUri = accountUri + "/" + data.group.id;
    var artifact = data.artifact;
    var version = data.version;
    var artifactUri = groupUri + '/' + artifact.id;
    var versionUri = groupUri + '/' + artifact.id + '/' + version.id;


    var graph = {
      "@type": "Dataset",
      "@id": versionUri + "#Dataset",
      "publisher": data.signature.selectedPublisherUri,
      "hasVersion": version.id,
      "title": artifact.title,
      "description": version.description,
      "license": version.license,
      "attribution": version.attribution,
      "distribution": []
    }

    if (data.signature.selectedPublisherUri == data.signature.defaultPublisherUri) {
      delete graph.publisher;
    }

    if (!data.signature.autoGenerateSignature) {
      graph["proof"] = {
        '@type': "dataid:DatabusTractateV1",
        'signature': data.signature.userSignature
      };
    }

    var customVariants = [];

    for (var fg in version.files) {

      var file = version.files[fg];

      var variantSuffix = '';
      for (var c in version.contentVariants) {
        var cv = version.contentVariants[c];
        var value = file.contentVariants[cv.id];

        if (value == undefined || value == "") {
          continue;
        }

        variantSuffix += '_' + cv.id + '=' + value;
      }

      var fileName = artifact.id; // DatabusUtils.uriToName(file.uri);

      var distributionUri = `${versionUri}#${fileName}`;
      var fileUri = `${versionUri}/${fileName}${variantSuffix}`;

      distributionUri += variantSuffix;

      if (file.formatExtension != 'none') {
        distributionUri += '.' + file.formatExtension;
        fileUri += '.' + file.formatExtension;
      }

      if (file.compression != 'none') {
        distributionUri += '.' + file.compression;
        fileUri += '.' + file.compression;
      }

      var distribution = {
        "@type": "Part",
        "formatExtension": file.formatExtension,
        "compression": file.compression,
        "downloadURL": file.uri,
        "byteSize": file.byteSize,
        "sha256sum": file.sha256sum,
      };

      for (var c in version.contentVariants) {
        var cv = version.contentVariants[c];
        var value = file.contentVariants[cv.id];

        if (value == undefined || value == "") {
          continue;
          // value = "";
        }

        distribution['dcv:' + cv.id] = value;

        if (!customVariants.includes(cv.id)) {
          customVariants.push(cv.id);
        }
      }

      graph.distribution.push(distribution);
    }

    var result = {
      "@context": 'https://downloads.dbpedia.org/databus/context.jsonld',
      "@graph": [graph]
    }

    return result;
  }

  
}



if (typeof module === "object" && module && module.exports)
  module.exports = DataIdCreator;
