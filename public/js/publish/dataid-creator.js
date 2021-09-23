class DataIdCreator {

  constructor(accountName) {
    this.accountName = accountName;
  }

  createGroupUpdate(data) {

    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountName}`;

    return {
      "@context": JSONLD_CONTEXT,
      "@graph": [
        {
          "@id": `${accountUri}/${data.group.id}`,
          "@type": "Group",
          "label": {
            "@value": data.group.label,
            "@language": "en"
          },
          "title": {
            "@value": data.group.label,
            "@language": "en"
          },
          "comment": {
            "@value": data.group.abstract,
            "@language": "en"
          },
          "abstract": {
            "@value": data.group.abstract,
            "@language": "en"
          },
          "description": {
            "@value": data.group.description,
            "@language": "en"
          },
        }
      ]
    };
  }

  createVersionUpdate(data) {

    var accountUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountName}`;
    var groupUri = accountUri + "/" + data.group.id;
    var artifact = data.artifact;
    var version = data.version;
    var artifactUri = groupUri + '/' + artifact.id;
    var versionUri = groupUri + '/' + artifact.id + '/' + version.id;

    var artifactGraph = {
      "@type": "dataid:Artifact",
      "@id": artifactUri,
    }

    var versionGraph = {
      "@type": "dataid:Version",
      "@id": versionUri,
    }

    var graph = {
      "@type": "dataid:Dataset",
      "@id": versionUri + "/dataid.jsonld#Dataset",
      "version": versionUri,
      "artifact": artifactUri,
      "group": groupUri,
      "publisher": data.signature.selectedPublisherUri,
      "hasVersion": version.id,
      "issued": new Date(Date.now()).toISOString(),
      "label": {
        "@value": artifact.label,
        "@language": "en"
      },
      "title": {
        "@value": artifact.label,
        "@language": "en"
      },
      "comment": {
        "@value": artifact.abstract,
        "@language": "en"
      },
      "abstract": {
        "@value": artifact.abstract,
        "@language": "en"
      },
      "description": {
        "@value": version.description,
        "@language": "en"
      },
      "license": {
        "@id": version.license,
      },
      "distribution": []
    }

    if (!data.signature.autoGenerateSignature) {
      graph["https://w3id.org/security#proof"] = data.signature.proof;
    }

    var customVariants = [];

    for (var fg in version.files) {

      var file = version.files[fg];

      var variantSuffix = '';
        for(var c in version.contentVariants) {
          var cv = version.contentVariants[c];
          var value = file.contentVariants[cv.id];

          if(value == undefined) {
            value = "";
          }
          
          variantSuffix += '_' + cv.id + '=' + value;
        }


        var distributionUri =  `${versionUri}/dataid.jsonld#dist`;
        var fileUri = `${versionUri}/file${variantSuffix}`;

        distributionUri += variantSuffix;

        if(file.format != 'none') {
          distributionUri += '.' + file.format;
          fileUri += '.' + file.format;
        }

        if(file.compression != 'none') {
          distributionUri += '.' + file.compression;
          fileUri += '.' + file.compression;
        }

      var distribution = {
        "@id": distributionUri,
        "@type": "dataid:SingleFile",
        "issued": new Date(Date.now()).toISOString(),
        "file": fileUri,
        "format": file.format,
        "compression": file.compression,
        "downloadURL": file.uri,
        "byteSize": file.byteSize,
        "sha256sum": file.sha256sum,
        "hasVersion": version.id,
      };

      for (var c in version.contentVariants) {
        var cv = version.contentVariants[c];
        var value = file.contentVariants[cv.id];

        if (value == undefined) {
          value = "";
        }
        distribution['dataid-cv:' + cv.id] = value;

        if (!customVariants.includes(cv.id)) {
          customVariants.push(cv.id);
        }
      }

      graph.distribution.push(distribution);
    }

    var result = {
      "@context": JSONLD_CONTEXT,
      "@graph": [graph, artifactGraph, versionGraph]
    }

    for (var c in customVariants) {
      var cv = customVariants[c];

      result["@graph"].push({
        "@type": "rdf:Property",
        "@id": `http://dataid.dbpedia.org/ns/cv#${cv}`,
        "rdfs:subPropertyOf": {
          "@id": "dataid:contentVariant"
        }
      });
    }

    return result;
  }

  /*
  createDataid() {

    var session = $scope.upload.session;
    session.result = {};

    var result = session.result;

    $scope.upload.session.groupUpdates = [];

    var group = session.group;

    $scope.upload.session.groupUpdates.push({
      "@context": DataIdCreator.getContext(),
      "@graph": [
        {
          "@id": "https://databus.dbpedia.org/" + session.username + "/" + group.id,
          "@type": "Group",
          "label": {
            "@value": group.label,
            "@language": "en"
          },
          "title": {
            "@value": group.label,
            "@language": "en"
          },
          "comment": {
            "@value": group.abstract,
            "@language": "en"
          },
          "abstract": {
            "@value": group.abstract,
            "@language": "en"
          },
          "description": {
            "@value": group.description,
            "@language": "en"
          },
        }
      ]
    });

    var userUri = "https://databus.dbpedia.org/" + session.username;
    var groupUri = userUri + "/" + group.id;

    var artifact = $scope.upload.session.artifact;
    var version = $scope.upload.session.version;

    var artifactUri = groupUri + '/' + artifact.id;
    var versionUri = groupUri + '/' + artifact.id + '/' + version.id;

    var variantGraph = {};

    var graph = {
      "@type": "dataid:Dataset",
      "@id": versionUri + "/dataid.ttl#Dataset",
      "version": versionUri,
      "artifact": artifactUri,
      "group": groupUri,
      "hasVersion": version.id,
      "issued": new Date(Date.now()).toISOString(),
      "label": {
        "@value": artifact.label,
        "@language": "en"
      },
      "title": {
        "@value": artifact.label,
        "@language": "en"
      },
      "comment": {
        "@value": artifact.abstract,
        "@language": "en"
      },
      "abstract": {
        "@value": artifact.abstract,
        "@language": "en"
      },
      "description": {
        "@value": version.description,
        "@language": "en"
      },
      "license": {
        "@id": version.license,
      },
      "distribution": []
    }

    for (var fg in version.files) {

      var fileGroup = version.files[fg];

      for (var f in fileGroup.distributions) {

        var file = fileGroup.distributions[f];

        var distribution = {
          "@id": file.uri,
          "@type": "dataid:SingleFile",
          "format": file.format,
          "compression": file.compression,
          "downloadURL": file.uri,
          "byteSize": file.byteSize,
          "sha256sum": session.sha256[file.uri].value,
          "hasVersion": version.id,
        };

        for (var c in version.contentVariants) {
          var cv = version.contentVariants[c];
          var value = fileGroup.contentVariants[cv.id];

          if (value == undefined) {
            value = "";
          }
          distribution['dataid-cv:' + cv.id] = value;
        }

        graph.distribution.push(distribution);
      }
    }

    var versionUpdate = {
      "@context": DataIdCreator.getContext(),
      "@graph": [
        graph
      ]
    }



    for (var c in version.contentVariants) {
      var cv = version.contentVariants[c];

      var cvGraph = {
        "@type": "rdf:Property",
        "@id": 'dataid-cv:' + cv.id,
        "rdfs:subPropertyOf": {
          "@id": "dataid:contentVariant",
        }
      };

      versionUpdate["@graph"].push(cvGraph);

    }

    $scope.upload.session.versionUpdates = [];
    $scope.upload.session.versionUpdates.push(versionUpdate);

  }*/
}