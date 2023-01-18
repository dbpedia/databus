

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

    constructor(session, accountData) {

        this.accountData = accountData;

        for(var group of this.accountData.groups) {
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

        if(session != null) {
            this.selectGroup(session.currentGroup);
            this.selectArtifact(session.currentArtifact);
        }
        this.dataIdCreator = new DataIdCreator(this.formData, this.accountData.accountName);
        this.inputs = this.dataIdCreator.createInputs();
    }

    selectGroup(targetGroup) {

        if(targetGroup == null) {
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
            this.currentArtifact = null;
            this.setCreateNewArtifact(artifact.createNew);
        }
    }

    selectArtifact(targetArtifact) {
        if(targetArtifact == null) {
            return;
        }

        var artifact = this.formData.artifact;
        artifact.name = targetArtifact.name;
        artifact.title = targetArtifact.title;
        artifact.abstract = targetArtifact.abstract;
        artifact.description = targetArtifact.description;
        this.currentArtifact = targetArtifact;
    }

    setCreateNewGroup(value) {
        if (value) {
            this.formData.group.createNew = true
            this.formData.group.name = "";
            this.formData.group.title = "";
            this.formData.group.abstract = "";
            this.formData.group.description = "";
            this.formData.group.generateAbstract = true;
            this.currentGroup = null;
            this.setCreateNewArtifact(true);
        } else {
            this.formData.group.publishGroupOnly = false;
            var hasGroups = DatabusUtils.objSize(this.accountData.groups) > 0;

            if (!hasGroups) {
                this.setCreateNewGroup(true);
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
        if (value) {
            this.formData.artifact.createNew = value;
            this.formData.artifact.name = "";
            this.formData.artifact.title = "";
            this.formData.artifact.description = "";
            this.currentArtifact = null;

        } else {

            if (!this.currentGroup.hasArtifacts) {
                this.setCreateNewArtifact(true);
                return;
            }

            if (this.currentArtifact == null) {
                this.selectArtifact(this.currentGroup.artifacts[0]);
            }
        }
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

    addFile(file) {
        this.formData.addFile(file);
    }

    static resume(accountData) {

        var sessionData = JSON.parse(window.sessionStorage.getItem(PublishSession.sessionStorageKey));

        if (sessionData == null || sessionData.accountData == null) {
            return null;
        }

        if (sessionData.accountData.accountName != accountData.accountName) {
            return null;
        }

        var publishSession = new PublishSession(sessionData, accountData);

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
                !this.formData.version.errors.length > 0;
        }
    }
}