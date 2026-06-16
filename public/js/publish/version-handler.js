const EntityHandler = require('./entity-handler');
const DatabusUtils = require('../utils/databus-utils');
const DatabusUris = require('../utils/databus-uris');
const GroupData = require('./group-data');

class VersionHandler extends EntityHandler {
  constructor($http, $interval, accounts, apiKeys) {
    super('databus_registration_version_data', $http, $interval, accounts, apiKeys);
  }

  initialize(data) {
    const validAccount = data && this.accounts.some(acc => acc.accountName === data.accountName);

    if (validAccount) {
      Object.assign(this, data);
    } else {
      this.accountName = this.accounts[0]?.name;
    }

    if (this.apiKeyName == null && this.apiKeys != null && this.apiKeys.length > 0) {
      this.apiKeyName = this.apiKeys[0].keyname;
    }

    this.pageIndex ??= 0;
    this.sendmode ??= 'register';
    this.files ??= [];
    this.contentVariants ??= [];

    if (!this.contentVariants.some(v => v.id == 'formatExtension')) {
      this.contentVariants.push({
        label: 'Format',
        id: 'formatExtension',
        custom: false
      });
    }

    if (!this.contentVariants.some(v => v.id == 'compression')) {
      this.contentVariants.push({
        label: 'Compression',
        id: 'compression',
        custom: false
      });
    }

    let self = this;

    this.$interval(function () {
      if (self.hasLicenseQueryChanged) {

        self.$http.get(`/app/publish-wizard/licenses?limit=30&keyword=${self.licenseQuery}`)
          .then(function (response) {
            self.filteredLicenseList = response.data.results.bindings;
          });

        self.hasLicenseQueryChanged = false;
      }

    }, 300);

    this.licenseQuery = "";
    this.filterLicenses();
    this.onAccountNameChanged();
    this.onGroupNameChanged();
    this.onArtifactNameChanged();
  }

  getURI() {
    return `${DATABUS_RESOURCE_BASE_URL}/${this.accountName}/${this.groupName}/${this.artifactName}/${this.name}`;
  }

  setLicense(license) {
    this.license = license;
    this.onChange();
  }

  filterLicenses() {
    this.hasLicenseQueryChanged = true;
  }

  validate() {
    this.errors = [];
    this.warnings = [];

    if (!DatabusUtils.isValidVersionIdentifier(this.name)) {
      this.errors.push('err_invalid_version_name');
    }

    if (!DatabusUtils.isValidGroupName(this.groupName)) {
      this.errors.push('err_no_group_selected');
    }

    if (!DatabusUtils.isValidArtifactName(this.artifactName)) {
      this.errors.push('err_no_artifact_selected');
    }

    if (!DatabusUtils.isValidResourceLabel(this.title, 1)) {
      this.errors.push('err_invalid_version_title');
    }

    if (!DatabusUtils.isValidResourceText(this.abstract, 1)) {
      this.errors.push('err_invalid_version_abstract');
    }

    if (!DatabusUtils.isValidResourceText(this.description, 1)) {
      this.errors.push('err_invalid_version_description');
    }

    if (!DatabusUtils.isValidUrl(this.license)) {
      this.errors.push('err_invalid_version_license');
    }

    if (this.files.length == 0) {
      this.errors.push('err_no_files');
    }

    for (let file of this.files) {
      file.errors = [];
    }

    this.fileErrors = [];

    this.cvSplit(this.files, 0);

    for (let file of this.files) {
      for (let error of file.errors) {
        this.errors.push(error);
        this.fileErrors.push(error);
      }
    }

    const exists = this.artifactList?.some(a => a.name === this.name);
    if (exists) {
      this.warnings.push('warning_artifact_exists');
    }
  }

  getSaveData() {
    return {
      accountName: this.accountName,
      groupName: this.groupName,
      artifactName: this.artifactName,
      name: this.name,
      title: this.title,
      abstract: this.abstract,
      description: this.description,
      sendmode: this.sendmode,
      apiKeyName: this.apiKeyName,
      wasDerivedFrom: this.wasDerivedFrom,
      attribution: this.attribution,
      license: this.license,
      pageIndex: this.pageIndex,
      contentVariants: this.contentVariants,
      files: this.files
    };
  }


  async setGroupName(groupName) {
    if (this.groupName !== groupName) {
      this.groupName = groupName;
      await this.onGroupNameChanged();
    }
  }

  async onGroupNameChanged() {
    this.isLoadingArtifacts = true;
    this.artifactList = await this.sparqlClient.getArtifacts(this.accountName, this.groupName);
    this.isLoadingArtifacts = false;
    this.onChange();
  }

  async setArtifactName(artifactName) {
    if (this.artifactName !== artifactName) {
      this.artifactName = artifactName;
      await this.onArtifactNameChanged();
    }
  }

  async onArtifactNameChanged() {
    this.isLoadingVersions = true;
    this.versionList = await this.sparqlClient.getVersions(this.accountName, this.groupName, this.artifactName);
    this.isLoadingVersions = false;
    this.onChange();
  }


  updateOutputs() {

    const artifactUri = `${DATABUS_RESOURCE_BASE_URL}/${GroupData.getStringOrMissing(this.accountName)}/${GroupData.getStringOrMissing(this.groupName)}/${GroupData.getStringOrMissing(this.artifactName)}`;
    let versionUri = `${artifactUri}/${GroupData.getStringOrMissing(this.name)}`;

    let graph = {
      "@id": versionUri,
      "@type": "Version",
      "title": this.getValidString(this.title),
      "abstract": this.getValidString(this.abstract),
      "description": this.getValidString(this.description),
      "license": this.getValidString(this.license),
      "attribution": this.getValidString(this.attribution),
      "wasDerivedFrom": this.getValidString(this.wasDerivedFrom),
    }

    graph.distribution = [];


    let customVariants = [];

    for (var fg in this.files) {

      var file = this.files[fg];

      var variantSuffix = '';
      for (var c in this.contentVariants) {
        var cv = this.contentVariants[c];
        var value = file.contentVariants[cv.id];

        if (value == undefined || value == "") {
          continue;
        }

        variantSuffix += '_' + cv.id + '=' + value;
      }

      let fileName = this.artifactName;

      var distributionUri = `${versionUri}#${fileName}`;
      var fileUri = `${versionUri}/${fileName}${variantSuffix}`;

      distributionUri += variantSuffix;

      let formatExtension = this.getValidString(file.contentVariants['formatExtension']);

      if (formatExtension == undefined) {
        formatExtension = 'none';
      }

      if (formatExtension != 'none') {
        distributionUri += '.' + formatExtension;
        fileUri += '.' + formatExtension;
      }

      let compression = this.getValidString(file.contentVariants['compression']);

      if (compression == undefined) {
        compression = 'none';
      }

      if (compression != 'none') {
        distributionUri += '.' + compression;
        fileUri += '.' + compression;
      }

      var distribution = {
        "@type": "Part",
        "formatExtension": formatExtension,
        "compression": compression,
        "downloadURL": file.uri,
        "byteSize": file.byteSize,
        "sha256sum": file.sha256sum,
      };

      for (var c in this.contentVariants) {
        var cv = this.contentVariants[c];

        if (!cv.custom) {
          continue;
        }

        var value = file.contentVariants[cv.id];

        if (value == undefined || value == "") {
          continue;
        }

        distribution['dcv:' + cv.label] = value;

        if (!customVariants.includes(cv.id)) {
          customVariants.push(cv.id);
        }
      }

      graph.distribution.push(distribution);
    }




    this.postBody = {
      "@context": this.getContext(),
      "@graph": [
        graph
      ]
    };



    const payload = JSON.stringify(this.postBody, null, 2);
    const apiKey = this.apiKeys?.find(k => k.keyname === this.apiKeyName)?.apikey;

    this.curlCommand = [
      `curl -X POST ${DATABUS_RESOURCE_BASE_URL}/api/register \\`,
      `  -H "X-API-KEY: ${GroupData.getStringOrMissing(apiKey)}" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${payload}'`
    ].join('\n');
  }

  createVersionName(v) {
    if (v == 0) {
      this.name = new Date().toISOString().slice(0, 10);
    }

    if (v == 1) {
      this.name = new Date().toISOString().slice(0, 13);
    }

    this.onChange();
  }

  changePage(diff) {
    this.pageIndex = Math.max(0, this.pageIndex + diff);
    this.onChange();
  };

  addContentVariant(variant) {

    if (variant == undefined || variant == '') {
      return;
    }

    if (this.contentVariants == undefined) {
      this.contentVariants = [];
    }

    for (var c in this.contentVariants) {
      if (this.contentVariants[c].id == variant) {
        return;
      }
    }

    this.contentVariants.push({
      label: variant,
      id: DatabusUtils.uuidv4(),
      fillRegex: '',
      toLower: true,
      pruneWhitespaces: true,
      custom: true,
    });

    this.onChange();
  }


  removeContentVariant(variant) {
    this.contentVariants = this.contentVariants.filter(function (d) {
      return d.id != variant.id;
    });

    for (var f in this.files) {
      var file = this.files[f];
      delete file.contentVariants[variant.id];
    }

    this.editContentVariant = null;
    this.onChange();
  }

  addFiles(input) {
    var lines = input.split('\n');
    for (var line of lines) {
      if (line != undefined && line.length > 0) {
        this.addFile(line);
      }
    }
  }

  addFile(file) {

    if (typeof file === 'string') {
      file = { url: file };
    }

    if (this.files == undefined) {
      this.files = [];
    }

    // Check if already added
    for (var f in this.files) {
      if (file.url == this.files[f].url) {
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

    this.files.push({
      id: uri,
      uri: file.url,
      name: name,
      contentVariants: file.contentVariants != null ? file.contentVariants : {},
      rowspan: 1,
    });

    this.files.sort(function (a, b) {
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

    let k = 1;

    for (let file of this.files) {
      file.rowIndex = k++;
    }

    this.onChange();
  }

  removeFile = function (file, index) {
    this.files.splice(index, 1);
    this.onChange();
  }


  fill(variant) {

    var val = variant.fillRegex;

    for (var file of this.files) {

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

    this.onChange();
  }

  fillByRegex(variant) {
    var regex = new RegExp(variant.fillRegex);

    for (var file of this.files) {
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

    this.onChange();
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


  cvSplit(files, cvIndex) {

    if (files.length <= 1) {
      return;
    }

    if (this.contentVariants == undefined) {
      this.contentVariants = [];
    }
    // if end of cvs, assign errors to all files if files.length > 1
    if (cvIndex - 2 >= this.contentVariants.length) {

      if (files.length > 1) {

        var cvHints = [];

        if (this.contentVariants.length == 0) {
          cvHints.push('No content variants have been added yet. Add content variants in the files panel in order to tag your files.');
        } else {
          for (var c in this.contentVariants) {
            var cv = this.contentVariants[c];
            var value = files[0].contentVariants[cv.id];

            if (value == undefined || value == '') {
              value = 'none';
            }

            cvHints.push(cv.id + ': ' + value);
          }
        }

        for (let file of files) {

          var errorMessage = 'Row ' + file.rowIndex + ' (' +
            cvHints.join(', ') + ').';

          file.errors.push({ key: 'err_duplicate_file', message: errorMessage });
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
        key = file.contentVariants[this.contentVariants[cvIndex - 2].id];
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
      this.cvSplit(buckets[b], cvIndex + 1);
    }
  }

  onEditContentVariant(index) {
    this.editContentVariant = this.contentVariants[index];
  }

}

module.exports = VersionHandler;
