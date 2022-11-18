// Controller for the header section
function PublishWizardController($scope, $http, focus, $q) {

  $scope.authenticated = data.auth.authenticated;
  $scope.licenseQuery = "";
  $scope.loadRequestCount = 0;


  // TODO
  // console.log(data.licenseData);
  // Test cases:
  // https://www.pik-potsdam.de/members/giannou/sample-output-remind/at_download/file
  // https://data.dnb.de/opendata/?C=M;O=D
  // http://caligraph.org/resources.html
  // https://openenergy-platform.org/ontology/oeo

  $scope.logMeIn = function () {
    window.location = '/system/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  $scope.createAccount = function () {
    window.location = '/app/account';
  }

  // controller does not work without authentication
  if (!$scope.authenticated) {
    return;
  }

  $scope.hasAccount = data.auth.info.accountName != undefined;;

  if (!$scope.hasAccount) {
    return;
  }

  // Keys for session saving and loading
  $scope.uploadSessionStorageKey = 'databus_upload';
  $scope.uploadSessionStorageIgnoreKeys = [
    '$$hashKey',
    'eventListeners',
    'hasLocalChanges',
    'fileFilterInput',
    'fileSuggestions',
    'progress',
    'streamQueue'
  ];

  $scope.result = {};

  $scope.filterLicenses = function (licenseQuery) {
    // billo-suche mit lowercase und tokenization 
    var tokens = licenseQuery.toLowerCase().split(' ');
    $scope.filteredLicenseList = data.licenseData.results.bindings.filter(function (l) {
      for (var token of tokens) {
        if (!l.title.value.toLowerCase().includes(token)) {
          return false;
        }
      }

      return true;
    });
  }

  $scope.filterLicenses("");

  $scope.watchSession = function () {
    return $scope.$watch('session', function (newVal, oldVal) {
      $scope.session.data.validate();

      if ($scope.session.dataIdCreator != undefined) {

        $scope.result.updateData = $scope.session.dataIdCreator.createUpdate($scope.session.data);
        $scope.result.groupUpdate = $scope.session.dataIdCreator.createGroupUpdate($scope.session.data);
        $scope.result.artifactUpdate = $scope.session.dataIdCreator.createArtifactUpdate($scope.session.data);
        $scope.result.versionUpdate = $scope.session.dataIdCreator.createVersionUpdate($scope.session.data);
        $scope.result.isReadyForUpload = $scope.checkReadyForUpload();

        if ($scope.result.isReadyForUpload) {
          // $scope.createTractate($scope.result.versionUpdate);
        }
      }

      $scope.saveSession();
    }, true);
  }

  // Saves the upload session to local storage
  $scope.saveSession = function () {
    try {
      var sessionData = JSON.stringify($scope.session, function (key, value) {
        if ($scope.uploadSessionStorageIgnoreKeys.includes(key)) {
          return undefined;
        }
        return value;
      });

      window.sessionStorage.setItem($scope.uploadSessionStorageKey, sessionData);
    } catch (e) {
      console.log(e);
    }
  }

  $scope.createSignatureData = function () {
    var signature = {};
    signature.publisherUris = [];

    for (var p in data.publisherData) {
      signature.publisherUris.push(data.publisherData[p].publisherUri);
    }

    signature.defaultPublisherUri = `${DATABUS_RESOURCE_BASE_URL}/${data.auth.info.accountName}#this`
    signature.selectedPublisherUri = signature.defaultPublisherUri;
    signature.autoGenerateSignature = true;
    signature.autoGenerateSignatureLocked = false;
    signature.userSignature = '';

    return signature;
  }

  $scope.createNewSession = function () {
    var session = {};
    session.data = new PublishData(null, $scope.accountData);
    session.data.validate();

    session.data.group.createNew = true;
    session.data.group.generateAbstract = true;
    session.data.artifact.createNew = true;
    session.data.artifact.generateAbstract = true;
    session.data.version.generateAbstract = true;
    session.data.version.useArtifactTitle = true;
    session.showContext = false;
    session.fetchFilesInput = "";
    session.addFileInput = "";
    session.activeStepIndex = 0;
    session.accountName = data.auth.info.accountName;
    session.isAccountDataLoading = true;
    session.data.signature = $scope.createSignatureData();
    session.dataIdCreator = new DataIdCreator(session.accountName);
    session.shasumClient = new ShasumClient($q, "/app/publish-wizard/analyze-file?url=", 3);
    $scope.session = session;
    $scope.saveSession();
    window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname;

  }

  $scope.resumeSession = function () {
    $scope.session = JSON.parse(window.sessionStorage.getItem($scope.uploadSessionStorageKey));

    if ($scope.session == null) {
      return;
    }

    $scope.session.data = new PublishData($scope.session.data, $scope.accountData);

    var signatureData = $scope.session.data.signature;

    // Update default uri
    signatureData.defaultPublisherUri = `${DATABUS_RESOURCE_BASE_URL}/${data.auth.info.accountName}#this`

    // Update publisher uris
    signatureData.publisherUris = [];
    for (var p in data.publisherData) {
      signatureData.publisherUris.push(data.publisherData[p].publisherUri);
    }

    if (!signatureData.publisherUris.includes(signatureData.selectedPublisherUri)) {
      signatureData.selectedPublisherUri = signatureData.defaultPublisherUri;
    }

    $scope.session.dataIdCreator = new DataIdCreator($scope.session.accountName);
    $scope.session.shasumClient = new ShasumClient($q, "/app/publish-wizard/analyze-file?url=", 3);
    $scope.session.isPublishing = false;
  }


  $scope.isWizardReady = false;

  $scope.onSelectPublisher = function (uri) {
    var signature = $scope.session.data.signature;
    signature.selectedPublisherUri = uri;

    var isDefaultUri = signature.defaultPublisherUri == uri;
    signature.autoGenerateSignature = isDefaultUri;
    signature.autoGenerateSignatureLocked = !isDefaultUri;
  }

  $scope.hints = {};

  $scope.hints.files = [
    "Use the file panel to fetch file URLs from resource pages or single file URLs. Fetching the URL verifies that the file is reachable and detects the file format and compression.",
    "Files with the same name but different formats will be grouped and displayed as a single entry in the file panel. Use the arrow button to expand the entry in order to display the detected formats.",
  ];

  $scope.hints.group = [
    "A Databus Group is a structure to help you organize your data artifacts.",
    "If you wanted to upload multiple artifacts about a common topic, a Databus Group provides a way to reflect this commonality.",
    "When uploading artifacts about fish, birds and mammals it would make sense to upload these in a group labelled 'animals'. The web interface only allows uploads to a single group per upload. The group 'general' will be selected by default."
  ];

  $scope.hints.artifact = [
    "A Databus Artifact is a logical dataset on the Databus. It may consist of multiple files in different formats or variants that describe the same thing or topic.",
    "For example, an Artifact labelled <b>Fish</b> could contain three files in different languages. All files would still contain information about fish.",
    "You can update new versions of your Databus Artifact anytime you like. The Artifact identifier remains static and allows users to access all released versions of your data",
  ];

  $scope.hints.variants = [
    "All files of a Databus Artifact have to be distinguishable by more than just the file name. Therefore, each file of an Artifact has to differ in at least one content variant dimension.",
    "For example, if you wanted to upload multiple translations of a text (each in its own file), the Databus would not auto-detect the aspect that makes each file different. You would have to tell the Databus manually that the text files contain the same text in different languages.",
    "You can add content variants to files by adding a content variant dimension (e.g. 'language' or 'lang') and inserting values (e.g. 'en', 'de', 'fr', ...) into the newly created column. "
  ];

  $scope.errorMessages = {
    'err_invalid_group_description': 'The group description is invalid. Please enter at least 25 characters.',
    'err_invalid_group_label': 'The group label is invalid. Please enter at least 3 characters.',
    'err_invalid_group_name': 'The group name is invalid. Please enter between 3 to 50 characters. Regex: [a-zA-Z0-9_\\-\\.]{3,50}$',
    'err_invalid_artifact_name': 'The artifact name is invalid. Please enter between 3 to 50 characters. Regex: [a-zA-Z0-9_\\-\\.]{3,50}$',
    'err_invalid_artifact_label': 'The artifact label is invalid. Please enter at least 3 characters.',
    'err_invalid_version_name': 'The version name is invalid. Please enter at least 3 characters.',
    'err_invalid_version_title': 'The version title is missing.',
    'err_invalid_version_abstract': 'The version abstract is missing.',
    
    'err_invalid_version_description': 'The version documentation is missing.',
    'err_invalid_version_license': 'The license is invalid. Please enter a license URI.',
    'err_no_files': 'You have to upload at least one file.',
    'err_not_analyzed': 'This file has not been analzyed yet.',

    'warning_group_exists': 'A group with this name already exits. Publishing will overwrite its metadata.',
    'warning_artifact_exists': 'An artifact with this name already exits. Publishing will overwrite its metadata.'
  };





  $scope.setCreateNewGroup = function (value) {

    var group = $scope.session.data.group;

    if (value) {

      group.createNew = true
      group.name = "";
      group.title = "";
      group.description = "";
      group.abstract = "";
      group.generateAbstract = true;
      $scope.session.accountGroup = null;
      $scope.setCreateNewArtifact(true);

    } else {

      group.publishGroupOnly = false;
      var hasGroups = DatabusUtils.objSize($scope.accountData.groups) > 0;

      if (!hasGroups) {
        $scope.setCreateNewGroup(true);
        return;
      }



      if ($scope.session.accountGroup == null) {
        for (var a in $scope.accountData.groups) {
          $scope.selectGroup($scope.accountData.groups[a]);
          break;
        }
      }
    }

  }

  $scope.setCreateNewArtifact = function (value) {

    var artifact = $scope.session.data.artifact;

    if (value) {
      artifact.createNew = value;
      artifact.name = "";
      artifact.title = "";
      artifact.description = "";
      $scope.session.accountArtifact = null;

    } else {

      var artifacts = $scope.accountData.artifacts.filter(function (value) {
        return value.group == $scope.session.accountGroup.uri;
      })



      if (artifacts.length == 0) {
        $scope.setCreateNewArtifact(true);
        return;
      }

      if ($scope.session.accountArtifact == null) {
        var targetArtifact = artifacts[0];
        $scope.selectArtifact(targetArtifact);
      }
    }
  }

  $scope.selectArtifact = function (targetArtifact) {
    var artifact = $scope.session.data.artifact;
    artifact.name = targetArtifact.name;
    artifact.title = targetArtifact.title;
    $scope.accountArtifact = targetArtifact;
  }

  $scope.selectGroup = function (targetGroup) {
    var group = $scope.session.data.group;
    var artifact = $scope.session.data.artifact;
    group.name = targetGroup.name;
    group.title = targetGroup.title;
    group.description = targetGroup.description;

    if ($scope.session.accountGroup != targetGroup) {
      $scope.session.accountGroup = targetGroup;
      $scope.session.accountGroup.artifacts =  $scope.accountData.artifacts.filter(function (value) {
        return value.group == $scope.session.accountGroup.uri;
      })

      $scope.session.accountArtifact = null;
      $scope.setCreateNewArtifact(artifact.createNew);
    }
  }

  /**
   * Fetches existing groups and artifacts
   */
  $scope.fetchGroupsAndArtifacts = function () {
    var uri = `/app/account/content?account=${encodeURIComponent(data.auth.info.accountName)}`;

    $http.get(uri).then(function (response) {
      

      $scope.isAccountDataLoading = false;
      $scope.accountData = response.data;

      // Reload the session from the session storage on reload
      try {

        $scope.resumeSession();

        if ($scope.session != null && $scope.session.isOver) {
          $scope.session = null;
        }

        if ($scope.session != null && $scope.session.accountName != data.auth.info.accountName) {
          $scope.session = null;
        }

      } catch (err) {
        // Any errors lead to a new clean session
        console.log(err);
        $scope.session = null;
      }

      if ($scope.session == null) {
        $scope.createNewSession();
      }

      $scope.isWizardReady = true;
      $scope.stopTheWatch = $scope.watchSession();

    }, function (err) {
      console.log(err);
    });
  }

  $scope.objSize = function (obj) {
    return DatabusUtils.objSize(obj);
  }

  $scope.checkReadyForUpload = function () {

    var group = $scope.session.data.group;
    var artifact = $scope.session.data.artifact;
    var version = $scope.session.data.version;

    if (group.errors.length > 0) {
      return false;
    }

    if (artifact.errors.length > 0) {
      return false;
    }

    if (version.errors.length > 0) {
      return false;
    }

    if (group.publishGroupOnly) {
      return true;
    }

    for (var f in version.files) {
      if (version.files[f].errors.length > 0) {
        return false;
      }
    }

    return true;
  }

  $scope.hasError = function (list, error) {
    for (var i in list) {
      if (list[i] == error) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add a link as a distribution. Doing so will auto-parse the format an compression
   * as content variant
   */
  $scope.addFile = function (input) {

    var session = $scope.session;


    if (input == undefined || input.length == 0) {
      return;
    }

    $scope.loadRequestCount++;

    $http.get('/app/publish-wizard/fetch-file?url=' + encodeURIComponent(input)).then(function (response) {

      $scope.loadRequestCount--;

      if (response.data == null || response.data == "" || response.status != 200) {
        return;
      }

      session.data.addFile(response.data);
      $scope.saveSession();

    }, function (err) {
      $scope.loadRequestCount--;
    });
  }

  $scope.analyzeFile = function (file) {
    $scope.session.shasumClient.analyzeFile(file);
  }

  $scope.removeFile = function (fileGroup) {
    var files = $scope.session.data.version.files;
    files.splice(files.findIndex(f => f.uri == fileGroup.uri), 1);
    $scope.session.data.version.isConfigDirty = true;
  }

  // Fetch links using the fetch-links API of the Databus
  $scope.fetchFiles = function (parentUri) {

    $scope.loadRequestCount++;

    $http.get('/app/publish-wizard/fetch-resource-page?url=' + encodeURIComponent(parentUri)).then(function (response) {
      for (var i in response.data) {
        var uri = response.data[i];
        $scope.addFile(uri);
      }
      $scope.loadRequestCount--;
    }, function (err) {
      $scope.loadRequestCount--;
    });
  }

  $scope.addFiles = function (input) {
    var lines = input.split('\n');

    for (var line of lines) {
      if (line != undefined && line.length > 0) {
        $scope.addFile(line);
      }
    }
  }


  $scope.publish = function () {

    var session = $scope.session;
    session.isPublishing = true;
    $scope.runPublishSequence();

  }

  $scope.postDeferred = function (data) {

    var deferred = $q.defer();

    var headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }

    fetch('/api/publish?verify-parts=true', {
      headers: headers,
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(data)
    }).then(function (fetchResult) {
      var decoder = new TextDecoder("utf-8");
      var reader = fetchResult.body.getReader();

      function push(reader) {
        return reader.read().then(({ done, value }) => {
          var chunk = decoder.decode(value);
          //console.log(chunk);

          var messages = chunk.split('\n');

          for (var message of messages) {
            $scope.result.publishLog.push({ hasError: false, message: message });
          }

          $scope.$apply();

          if (done) {
            deferred.resolve({ status: 'ok' });
            return true;
          }

          push(reader);

        }, function (err) {
          deferred.reject({ message: err });
        });
      };

      push(reader);

    }, function (err) {
      deferred.reject({ message: err });
    });

    return deferred.promise;
  }


  $scope.runPublishSequence = async function () {

    var output = $scope.result;
    output.publishLog = [];


    try {
      await $scope.postDeferred(output.updateData);

      $scope.session.isPublishing = false;
      $scope.$apply();
    } catch (err) {
      output.publishLog.push({ hasError: true, message: err.data });
      $scope.session.isPublishing = false;
      $scope.$apply();
    }
  }

  $scope.createTractate = function (graph) {
    $scope.creatingTracate = true;
    $http.post('/api/tractate/v1/canonicalize', graph).then(function (response) {
      $scope.session.data.signature.tractate = response.data;
      $scope.creatingTracate = false;
    }, function (err) {
      $scope.creatingTracate = false;
      console.log(err);
    });
  }

  $scope.getArtifact = function (groupId, artifactId) {
    var groups = $scope.session.groups;

    if (groups[groupId] == undefined || groups[groupId].artifacts[artifactId] == undefined) {
      return undefined;
    }

    return groups[groupId].artifacts[artifactId];
  }

  $scope.copyTracateToClipboard = function () {
    DatabusUtils.copyStringToClipboard($scope.session.data.signature.tractate);
  }

  $scope.onRemoveDistribution = function (distribution) {
    if (distribution.artifactId != undefined) {
      var artifact = $scope.getArtifact(distribution.groupId, distribution.artifactId);
      $scope.removeDistributionFromArtifact(artifact, distribution);
    } else {
      $scope.distributions = $scope.distributions.filter(function (d) {
        return d.uri != distribution.uri;
      });
    }

    $scope.saveSession();
  }

  $scope.fetchGroupsAndArtifacts();
}



// List of files needs to be transformed into the following structure:

// Group 
  // Artifact
    // Version
      // Dataset
        // Distribution
          // File
          // Format
          // Compression
          // CVs

