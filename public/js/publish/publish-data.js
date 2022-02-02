/**
 * Handles shasum creation (and possibly other file stats)
 */
class PublishData {

  constructor(data) {

    this.group = data != undefined ? data.group : {};
    this.artifact = data != undefined ? data.artifact : {};
    this.version = data != undefined ? data.version : {};
    this.signature = data != undefined ? data.signature : undefined;

  }

  /**
   * Validates the tree
   */
  validate() {

    var hasErrors = false;

    this.group.errors = [];

    if (!DatabusUtils.isValidResourceIdentifier(this.group.id, 3)) {
      this.group.errors.push('err_invalid_group_id');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceLabel(this.group.label, 3)) {
      this.group.errors.push('err_invalid_group_label');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceText(this.group.abstract, 25)) {
      this.group.errors.push('err_invalid_group_abstract');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceText(this.group.description, 25)) {
      this.group.errors.push('err_invalid_group_description');
      hasErrors = true;
    }

    this.artifact.errors = [];

    if (!DatabusUtils.isValidResourceIdentifier(this.artifact.id)) {
      this.artifact.errors.push('err_invalid_artifact_id');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceLabel(this.artifact.label, 3)) {
      this.artifact.errors.push('err_invalid_artifact_label')
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceText(this.artifact.abstract, 25)) {
      this.artifact.errors.push('err_invalid_artifact_abstract');
      hasErrors = true;
    }

    this.version.errors = [];

    if (!DatabusUtils.isValidVersionIdentifier(this.version.id)) {
      this.version.errors.push('err_invalid_version_id');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidUrl(this.version.license)) {
      this.version.errors.push('err_invalid_version_license');
      hasErrors = true;
    }

    if (!DatabusUtils.isValidResourceText(this.version.description, 25)) {
      this.version.errors.push('err_invalid_version_description');
      hasErrors = true;
    }

    if (DatabusUtils.objSize(this.version.files) == 0) {
      this.version.errors.push('err_no_files');
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

    for (var f in this.version.files) {

      var file = this.version.files[f];

      if (this.version.files[f].errors == undefined) {
        this.version.files[f].errors = [];
      }

      var analyzeErrIndex = file.errors.findIndex(e => e.id == 'err_file_not_analyzed');

      if(analyzeErrIndex > -1) {
        file.errors.splice(analyzeErrIndex, 1);
      }
     
      if (this.version.files[f].sha256sum == undefined || this.version.files[f].byteSize == undefined) {

        this.version.files[f].errors.push({
          id: 'err_file_not_analyzed',
          message: 'This file has not been analyzed yet. Press the eye icon to analyze the file.'
        });
      }

      if (this.version.files[f].errors.length > 0) {
        hasErrors = true;
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

    if (name.length > 32) {
      name = name.substr(0, 32) + '...';
    }
    // Files with uri as key!!

    this.version.files.push({
      id: uri,
      uri: file.url,
      name: name,
      contentVariants: {},
      sha256: {},
      format: file.format,
      compression: file.compression,
      artifactId: undefined,
      groupId: undefined,
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

    //var fileGroup = this.getOrCreateFileGroup(fileGroupId, nameComponents[0]);

    //for (var j in fileGroup.distributions) {
    //  if (uri == fileGroup.distributions[j].uri) {
    //    return;
    //  }
    //}

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
      id: variant
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

  createVersionId(v) {
    if (v == 0) {
      this.version.id = new Date().toISOString().slice(0, 10);
    }

    if (v == 1) {
      this.version.id = new Date().toISOString().slice(0, 13);
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
          cvHints.push('No content variants have been added yet. Add content variants in the artifact panel in order to tag your files.');
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

          var errorMessage = 'Content variants of files need to be unique. Duplicate content variant setting found at row '
            + index + ' (' +
            cvHints.join(', ') + ').';

          // TODO UNCOMMENT
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
        key = file.format;
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