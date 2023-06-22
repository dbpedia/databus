
const DatabusUtils = require("../utils/databus-utils");
const DatabusUris = require("../utils/databus-uris");
const JsonldUtils = require("../utils/jsonld-utils");
const PublishData = require("./publish-data");
const DataIdCreator = require("./dataid-creator");

class PublishSession {

    static sessionStorageKey = 'databus_upload';
    static sessionStorageIgnoreKeys = [
        '$$hashKey',
        'eventListeners',
        'hasLocalChanges',
        'fileFilterInput',
        'fileSuggestions',
        'progress',
        'streamQueue'
    ];

    constructor($http, session, accountData) {

        this.$http = $http;
        this.accountData = accountData;

        for (var group of this.accountData.groups) {
            group.artifacts = this.accountData.artifacts.filter(function (value) {
                return value.groupName == group.name;
            });
            group.hasArtifacts = group.artifacts.length > 0;
        }

        this.formData = new PublishData(session != null ? session.formData : null, accountData);
        this.formData.validate();


        this.initializeField(session, 'showContext', false);
        this.initializeField(session, 'fetchFilesInput', "");
        this.initializeField(session, 'addFileInput', "");
        this.initializeField(session, 'isAccountDataLoading', true);
        this.initializeField(session, 'addFileInput', "");
        this.initializeField(session, 'currentArtifact', null);
        this.initializeField(session, 'currentGroup', null);


        this.availableGroups = [];
        this.availableArtifacts = [];
        this.availableVersions = [];


        this.isGroupLoading = false;
        this.isArtifactLoading = false;
        this.isVersionLoading = false;

        if (session != null) {

            if (session.currentGroup != null) {
                var group = accountData.groups.find(g => g.uri == session.currentGroup.uri);
                this.selectGroup(group);
            }

            if (session.currentArtifact != null) {
                var artifact = accountData.artifacts.find(a => a.uri == session.currentArtifact.uri);
                this.selectArtifact(artifact);
            }
        }


        this.dataIdCreator = new DataIdCreator(this.formData, this.accountData.accountName);
        this.inputs = this.dataIdCreator.createInputs();

    }

    selectGroup(targetGroup) {

        if (targetGroup == null) {
            return;
        }

        var group = this.formData.group;
        var artifact = this.formData.artifact;

        group.name = targetGroup.name;
        group.title = targetGroup.title;
        group.abstract = targetGroup.abstract;
        group.description = targetGroup.description;

        if (this.currentGroup == null || this.currentGroup.name != targetGroup.name) {
            this.currentGroup = targetGroup;

            if (this.formData.artifact.generateMetadata == 'existing') {
                this.currentArtifact = null;
                this.setCreateNewArtifact('create');
            }
        }
    }

    selectArtifact(targetArtifact) {
        if (targetArtifact == null) {
            return;
        }

        var artifact = this.formData.artifact;
        artifact.name = targetArtifact.name;
        artifact.title = targetArtifact.title;
        artifact.abstract = targetArtifact.abstract;
        artifact.description = targetArtifact.description;
        this.currentArtifact = targetArtifact;

        this.availableVersions = this.accountData.versions.filter(function (v) {
            return v.startsWith(targetArtifact.uri);
        });
    }

    selectVersion = function (versionUri) {

        try {
            var relativeUri = new URL(versionUri).pathname;
            var options = {
                method: 'GET',
                url: relativeUri,
                headers: {
                    'Accept': 'application/ld+json',
                    'X-Jsonld-Formatting': 'flatten'
                }
            };

            var version = this.formData.version;
            version.isLoading = true;

            var self = this;

            this.$http(options).then(function (response) {

                var version = self.formData.version;
                version.isLoading = false;

                var versionData = response.data;
                var versionGraph = JsonldUtils.getTypedGraph(versionData, DatabusUris.DATABUS_VERSION);

                version.name = DatabusUtils.uriToName(versionGraph[DatabusUris.JSONLD_ID]);
                version.title = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_TITLE);
                version.abstract = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_ABSTRACT);
                version.description = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_DESCRIPTION);
                version.attribution = JsonldUtils.getProperty(versionGraph, DatabusUris.DATABUS_ATTRIBUTION);
                version.license = JsonldUtils.getProperty(versionGraph, DatabusUris.DCT_LICENSE);
                version.derivedFrom = JsonldUtils.getProperty(versionGraph, DatabusUris.PROV_WAS_DERIVED_FROM);
                version.contentVariants = [];

                var contentVariantGraphs = JsonldUtils.getTypedGraphs(versionData, DatabusUris.RDF_PROPERTY);

                for(var contentVariantGraph of contentVariantGraphs) {

                    var variantName = DatabusUtils.uriToName(contentVariantGraph[DatabusUris.JSONLD_ID]);
                    self.formData.addContentVariant(variantName);
                }

                // Add Files!
                var fileGraphs = JsonldUtils.getTypedGraphs(versionData, DatabusUris.DATABUS_PART);
                version.files = [];

                for (var fileGraph of fileGraphs) {

                    var fileUri = JsonldUtils.getProperty(fileGraph, DatabusUris.DCAT_DOWNLOAD_URL);

                  

                    var file = {
                        id: fileUri,
                        url: fileUri,
                        name: DatabusUtils.uriToName(fileUri),
                        compression: JsonldUtils.getProperty(fileGraph, DatabusUris.DATABUS_COMPRESSION),
                        formatExtension: JsonldUtils.getProperty(fileGraph, DatabusUris.DATABUS_FORMAT_EXTENSION),
                        contentVariants: {}
                    }

                    for(var contentVariant of version.contentVariants) {
                        var variantUri = `${DatabusUris.DATABUS_CONTENT_VARIANT_PREFIX}${contentVariant.id}`;
                        var variantValue = JsonldUtils.getProperty(fileGraph, variantUri);

                        if(variantValue != null) {
                            file.contentVariants[contentVariant.id] = variantValue;
                        }
                    }

                    self.formData.addFile(file);
                }


                // Save the preset values
                delete version.preset;
                version.preset = JSON.parse(JSON.stringify(version));
            });


        } catch (err) {
            console.log(err);
        }
    }

    addFile(file) {
        this.formData.addFile(file);
    }


    setCreateNewGroup(value) {
        this.formData.group.generateMetadata = value;
        if (value == 'create') {
            this.formData.group.name = "";
            this.formData.group.title = "";
            this.formData.group.abstract = "";
            this.formData.group.description = "";
            this.formData.group.generateAbstract = true;
            this.currentGroup = null;

            if (this.formData.artifact.generateMetadata == 'existing') {
                this.setCreateNewArtifact('create');
            }
        } else if (value == 'existing') {
            var hasGroups = DatabusUtils.objSize(this.accountData.groups) > 0;

            if (!hasGroups) {
                this.setCreateNewGroup('create');
                return;
            }

            if (this.currentGroup == null) {
                for (var group of this.accountData.groups) {
                    this.selectGroup(group);
                    break;
                }
            }
        }
    }

    setCreateNewArtifact(value) {
        this.formData.artifact.generateMetadata = value;

        if (value == 'create') {

            this.availableVersions = [];
            this.formData.artifact.name = "";
            this.formData.artifact.title = "";
            this.formData.artifact.description = "";
            this.currentArtifact = null;

            if (this.formData.version.generateMetadata == 'existing') {
                this.setCreateNewVersion('create');
            }

        } else if (value == 'existing') {

            if (!this.currentGroup.hasArtifacts) {
                this.setCreateNewArtifact('create');
                return;
            }

            if (this.currentArtifact == null) {
                this.selectArtifact(this.currentGroup.artifacts[0]);
            }
        } else {

            this.availableVersions = [];
            if (this.formData.version.generateMetadata != 'none') {
                this.setCreateNewVersion('none');
            }
        }
    }

    setCreateNewVersion(value) {
        this.formData.version.generateMetadata = value;

        if (value == 'create') {


        } else if (value == 'existing') {

            if (this.availableVersions.length == 0) {
                this.setCreateNewVersion('create');
                return;
            }

            this.selectVersion(this.availableVersions[0]);
        }

    }
    currentGroupHasArtifacts() {
        if (this.formData.group.generateMetadata == 'create') {
            return false;
        }

        return this.currentGroup.artifacts != null && this.currentGroup.artifacts.length > 0;
    }

    initializeField(source, name, defaultValue) {
        this[name] = source != null ? source[name] : defaultValue;
    }

    save() {
        try {
            var sessionDataString = JSON.stringify(this, function (key, value) {
                if (PublishSession.sessionStorageIgnoreKeys.includes(key)) {
                    return undefined;
                }
                return value;
            });

            window.sessionStorage.setItem(PublishSession.sessionStorageKey, sessionDataString);
        } catch (e) {
            console.log(e);
        }
    }

    static resume($http, accountData) {

        var sessionData = JSON.parse(window.sessionStorage.getItem(PublishSession.sessionStorageKey));

        if (sessionData == null || sessionData.accountData == null) {
            return null;
        }

        if (sessionData.accountData.accountName != accountData.accountName) {
            return null;
        }

        var publishSession = new PublishSession($http, sessionData, accountData);

        return publishSession;
    }

    onChange() {
        this.formData.validate();
        this.inputs = this.dataIdCreator.createInputs();
        this.save();

        if (this.dataIdCreator != undefined) {
            this.inputs = this.dataIdCreator.createInputs();

            this.isReadyForUpload =
                !this.formData.artifact.errors.length > 0 &&
                !this.formData.group.errors.length > 0 &&
                !this.formData.version.errors.length > 0 &&
                !this.formData.files.errors.length > 0;
        }
    }
}

module.exports = PublishSession;
