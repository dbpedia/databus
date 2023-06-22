const DatabusUtils = require("../utils/databus-utils");

/**
 * Handles shasum creation (and possibly other file stats)
 */
class PublishData {

  constructor(data, accountData) {

    this.accountData = accountData;
    this.group = data != undefined ? data.group : {};
    this.artifact = data != undefined ? data.artifact : {};
    this.version = data != undefined ? data.version : {};
    this.files = data != undefined ? data.files : {};
    this.signature = data != undefined ? data.signature : undefined;

    if (data == null) {
      this.group.generateMetadata = 'create';
      this.group.generateAbstract = true;
      this.artifact.generateMetadata = 'create';
      this.artifact.generateAbstract = true;
      this.version.generateMetadata = 'create';
      this.version.generateAbstract = true;
      this.version.useArtifactTitle = true;
      this.signature = this.createSignatureData();
    }
  }

  createSignatureData() {
    var signature = {};
    signature.publisherUris = [];

    signature.publisherUris = this.accountData.publisherUris;
    signature.defaultPublisherUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountData.accountName}#this`
    signature.selectedPublisherUri = signature.defaultPublisherUri;
    signature.autoGenerateSignature = true;
    signature.autoGenerateSignatureLocked = false;
    signature.userSignature = '';

    return signature;
  }

  hasError(error) {

  }
  /**
   * Validates the tree
   */
  validate() {

    var hasErrors = false;
    this.group.errors = [];
    this.artifact.errors = [];
    this.version.errors = [];
    this.files.errors = [];
    this.group.warnings = [];
    this.artifact.warnings = [];
    this.version.warnings = [];


    if (!DatabusUtils.isValidGroupName(this.group.name)) {
      this.group.errors.push('err_invalid_group_name');
      hasErrors = true;
    }

    var self = this;

    var existingGroup = this.accountData.groups.filter(function (value) {
      return value.name == self.group.name;
    });

    if (existingGroup.length > 0 && this.group.generateMetadata == 'create') {
      this.group.warnings.push('warning_group_exists');
    }

    var existingArtifact = this.accountData.artifacts.filter(function (value) {
      return value.groupName == self.group.name && value.name == self.artifact.name;
    });

    if (existingArtifact.length > 0 && this.artifact.generateMetadata == 'create') {
      this.artifact.warnings.push('warning_artifact_exists');
    }

    if (this.group.generateAbstract) {
      this.group.abstract = DatabusUtils.createAbstractFromDescription(this.group.description);
    }

    if (this.version.generateAbstract) {
      this.version.abstract = DatabusUtils.createAbstractFromDescription(this.version.description);
    }

    if (this.version.useArtifactTitle) {
      this.version.title = this.artifact.title;
    }

    if (this.artifact.generateAbstract) {
      this.artifact.abstract = DatabusUtils.createAbstractFromDescription(this.artifact.description);
    }

    if (this.group.publishGroupOnly) {
      this.hasConfigurationError = hasErrors;
      return;
    }

    if (this.artifact.generateMetadata != 'none') {
      if (!DatabusUtils.isValidArtifactName(this.artifact.name)) {
        this.artifact.errors.push('err_invalid_artifact_name');
        hasErrors = true;
      }
    }

    var versionUri = `${DATABUS_RESOURCE_BASE_URL}/${this.accountData.accountName}/${this.group.name}/${this.artifact.name}/${this.version.name}`;

    var existingVersion = this.accountData.versions.filter(function (value) {
      return value == versionUri;
    });

    if (existingVersion.length > 0) {
      this.version.warnings.push('warning_version_exists');
    }

    if (this.version.generateMetadata != 'none') {

      if (!DatabusUtils.isValidVersionIdentifier(this.version.name)) {
        this.version.errors.push('err_invalid_version_name');
        hasErrors = true;
      }

      if (!DatabusUtils.isValidUrl(this.version.license)) {
        this.version.errors.push('err_invalid_version_license');
        hasErrors = true;
      }

      if (!DatabusUtils.isValidResourceText(this.version.abstract, 1)) {
        this.version.errors.push('err_invalid_version_abstract');
        hasErrors = true;
      }

      if (!DatabusUtils.isValidResourceText(this.version.description, 1)) {
        this.version.errors.push('err_invalid_version_description');
        hasErrors = true;
      }


      if (DatabusUtils.objSize(this.version.files) == 0) {
        this.files.errors.push('err_no_files');
        hasErrors = true;
      }

      if (this.version.isConfigDirty) {


        var files = [];
        for (var f in this.version.files) {
          this.version.files[f].errors = [];
          files.push(this.version.files[f]);
        }

        this.cvSplit(this.version, files, 0);
        this.version.isConfigDirty = false;
      }
    }

    this.hasConfigurationError = hasErrors;
  }

  addFile(file) {


    if (this.version.files == undefined) {
      this.version.files = [];
    }


    for (var f in this.version.files) {
      if (file.url == this.version.files[f].url) {
        return;
      }
    }

    var uri = file.url;
    var uriParts = uri.split('/');
    var name = uriParts.pop();
    var nameComponents = name.split('.');
    name = nameComponents[0];

    if (name.length > 50) {
      name = name.substr(0, 50) + '...';
    }

    name = decodeURIComponent(name);
    // Files with uri as key!!

    this.version.files.push({
      id: uri,
      uri: file.url,
      name: name,
      contentVariants: file.contentVariants,
      compression: file.compression,
      formatExtension: file.formatExtension,
      rowspan: 1,
    });

    this.version.files.sort(function (a, b) {
      var nameA = a.name;
      var nameB = b.name;

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    this.version.isConfigDirty = true;
  }

  addContentVariant(variant) {

    if (variant == undefined || variant == '') {
      return;
    }

    if (this.version.contentVariants == undefined) {
      this.version.contentVariants = [];
    }

    for (var c in this.version.contentVariants) {
      if (this.version.contentVariants[c].id == variant) {
        return;
      }
    }

    this.version.contentVariants.push({
      label: variant,
      id: variant,
      fillRegex: '',
      toLower: true,
      pruneWhitespaces: true
    });

    this.version.isConfigDirty = true;
  }


  removeContentVariant(variant) {

    this.version.contentVariants = this.version.contentVariants.filter(function (d) {
      return d.id != variant.id;
    });

    for (var f in this.version.files) {
      var file = this.version.files[f];
      delete file.contentVariants[variant.id];
    }

    this.version.isConfigDirty = true;
  }

  fill(variant) {

    var val = variant.fillRegex;

    for (var file of this.version.files) {

      if (variant.toLower) {
        val = val.toLowerCase();
      }

      if (variant.pruneWhitespaces) {
        val = val.replaceAll(' ', '');
      }

      if (!variant.overwrite && file.contentVariants[variant.id] != undefined
        && file.contentVariants[variant.id].length > 0) {
        continue;
      }

      file.contentVariants[variant.id] = val;
    }

    this.version.isConfigDirty = true;
  }

  fillByRegex(variant) {
    var regex = new RegExp(variant.fillRegex);

    for (var f in this.version.files) {
      var file = this.version.files[f];
      var matches = file.name.match(regex);

      if (matches != null) {
        var val = matches[0];

        if (variant.toLower) {
          val = val.toLowerCase();
        }

        if (variant.pruneWhitespaces) {
          val = val.replaceAll(' ', '');
        }

        if (!variant.overwrite && file.contentVariants[variant.id] != undefined
          && file.contentVariants[variant.id].length > 0) {
          continue;
        }

        file.contentVariants[variant.id] = val;
      }
    }

    this.version.isConfigDirty = true;
  }

  createVersionName(v) {
    if (v == 0) {
      this.version.name = new Date().toISOString().slice(0, 10);
    }

    if (v == 1) {
      this.version.name = new Date().toISOString().slice(0, 13);
    }
  }

  getRowIndex(files, name) {
    var k = 1;
    for (var f in files) {
      if (files[f].name == name) {
        return k;
      }

      k++;
    }

    return -1;
  }


  cvSplit(artifact, files, cvIndex) {

    if (files.length <= 1) {
      return;
    }

    if (artifact.contentVariants == undefined) {
      artifact.contentVariants = [];
    }
    // if end of cvs, assign errors to all files if files.length > 1
    if (cvIndex - 2 >= artifact.contentVariants.length) {

      if (files.length > 1) {

        var cvHints = [];

        if (artifact.contentVariants.length == 0) {
          cvHints.push('No content variants have been added yet. Add content variants in the files panel in order to tag your files.');
        } else {
          for (var c in artifact.contentVariants) {
            var cv = artifact.contentVariants[c];
            var value = files[0].contentVariants[cv.id];

            if (value == undefined || value == '') {
              value = 'none';
            }

            cvHints.push(cv.id + ': ' + value);
          }
        }

        for (var f in files) {

          var index = 0;

          if (f == 0) {
            var index = this.getRowIndex(artifact.files, files[1].name);
          } else {
            var index = this.getRowIndex(artifact.files, files[0].name);
          }

          var errorMessage = 'The Databus requires any two files to be distinguishable by either their format, compression or any content variant. You have added a file with the exact same format, compression and content variants at row '
            + index + ' (' +
            cvHints.join(', ') + ').';

          files[f].errors.push({ key: 'err_duplicate_file', message: errorMessage });
        }
      }

      return;
    }

    // else create buckets and sort files into buckets
    var buckets = {};

    for (var f in files) {
      var file = files[f];

      var key = null;

      if (cvIndex == 0) {
        key = file.formatExtension;
      } else if (cvIndex == 1) {
        key = file.compression;
      } else {
        key = file.contentVariants[artifact.contentVariants[cvIndex - 2].id];
      }

      if (key == undefined || key == '') {
        key = '$_none$';
      }

      if (buckets[key] == undefined) {
        buckets[key] = [];
      }

      buckets[key].push(file);
    }

    // iterate buckets and call recursively
    for (var b in buckets) {
      this.cvSplit(artifact, buckets[b], cvIndex + 1);
    }
  }


  getOrCreateFileGroup(fileGroupId, name) {

    if (this.version.files == null) {
      this.version.files = {};
    }

    if (this.version.files[fileGroupId] == undefined) {

      this.version.files[fileGroupId] = {
        id: fileGroupId,
        name: name,
        contentVariants: {},
        distributions: [],
        artifactId: undefined,
        groupId: undefined,
      };
    }

    return this.version.files[fileGroupId];
  }

}

module.exports = PublishData;