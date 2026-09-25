const fuzzysort = require("fuzzysort");
const DatabusCollectionManager = require("../collections/databus-collection-manager");
const DatabusAlert = require("../components/databus-alert/databus-alert");
const DataIdCreator = require("../publish/dataid-creator");
const DatabusUtils = require("../utils/databus-utils");
const DatabusWebappUtils = require("../utils/databus-webapp-utils");
const TabNavigation = require("../utils/tab-navigation");

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightHtml(result, fallback) {
  if (!result || typeof result.target !== 'string' || !result.indexes || result.indexes.length === 0) {
    return escapeHtml(fallback || '');
  }

  var text = result.target;
  var indexes = result.indexes;
  var html = '';
  var last = 0;

  for (var i = 0; i < indexes.length;) {
    var start = indexes[i++];
    var end = start + 1;
    while (indexes[i] === end) {
      i++;
      end++;
    }
    html += escapeHtml(text.slice(last, start)) + '<b>' + escapeHtml(text.slice(start, end)) + '</b>';
    last = end;
  }

  return html + escapeHtml(text.slice(last));
}

var DEFAULT_IMAGE = "https://picsum.photos/id/223/320/320";

// Controller for the header section

/**
 * 
 * @param {*} $scope 
 * @param {*} $http 
 * @param {*} $location 
 * @param {DatabusCollectionManager} collectionManager 
 * @returns 
 */
function AccountPageController($scope, $http, $location, collectionManager, $sce) {

  $scope.collectionManager = collectionManager;


  // Pick up the profile data
  $scope.auth = data.auth;
  $scope.location = $location;
  $scope.account = data.account;

  // Exit if there is no profile
  if ($scope.account == undefined) {
    return;
  }


  // Create a tab navigation object for the tab navigation with locato
  $scope.tabNavigation = new TabNavigation($scope, $location, [
    'home', 'groups', 'collections', 'settings'
  ]);

  // Make some util functions available in the template
  $scope.utils = new DatabusWebappUtils($scope);
  $scope.accountName = $scope.utils.getAccountName();
  $scope.account.isOwn = $scope.accountName != null; //.auth.authenticated && $scope.auth.info.accountName == $scope.account.accountName;


  $scope.homeSearch = { input: '' };

  $scope.collectionSearchInput = '';
  $scope.collectionSearchSettings = {
    minRelevance: 0.01,
    maxResults: 10,
    placeholder: `Search ${$scope.account.accountName}'s collections...`,
    resourceTypes: ['Collection'],
    filter: `&publisher=${$scope.account.accountName}&publisherWeight=0&typeNameWeight=0`
  };


  // Wait for additional artifact data to arrive
  $scope.publishedData = {};
  $scope.publishedData.isLoading = true;

  $http.get(`/app/account/content?account=${encodeURIComponent($scope.account.accountName)}`)
    .then(function (response) {

      $scope.publishedData.isLoading = false;
      $scope.publishedData.groups = response.data.groups;
      $scope.publishedData.artifacts = response.data.artifacts;

      var latestByArtifact = {};
      (response.data.versions || []).forEach(function (versionUri) {
        var artifactUri = DatabusUtils.navigateUp(versionUri, 1);
        var name = DatabusUtils.uriToResourceName(versionUri);
        var current = latestByArtifact[artifactUri];
        if (!current || name > current.name) latestByArtifact[artifactUri] = { name: name, uri: versionUri };
      });

      for (var artifact of $scope.publishedData.artifacts) {
        var latest = latestByArtifact[artifact.uri];
        if (latest) {
          artifact.latestVersion = latest.name;
          artifact.latestVersionUri = latest.uri;
        }
        artifact.group = DatabusUtils.navigateUp(artifact.uri, 1);
        artifact.name = DatabusUtils.uriToName(artifact.uri);
        artifact.title = DatabusUtils.stringOrFallback(artifact.title, artifact.latestVersionTitle);
        artifact.abstract = DatabusUtils.stringOrFallback(artifact.abstract, artifact.latestVersionAbstract);
        artifact.description = DatabusUtils.stringOrFallback(artifact.description, artifact.latestVersionDescription);
      }

      for (var group of $scope.publishedData.groups) {
        group.title = DatabusUtils.stringOrFallback(group.title, group.name);
        group.artifacts = $scope.publishedData.artifacts.filter(function (a) {
          return a.group == group.uri;
        });
      }

      $scope.filterGroups();
      $scope.filterHome();

      // Order by latest version date
      $scope.recentUploads = $scope.publishedData.artifacts.filter(function (v) {
        return v.latestVersionDate != null;
      });
      $scope.recentUploads.sort(function (a, b) {
        return new Date(b.latestVersionDate) - new Date(a.latestVersionDate);
      });

      $scope.recentUploads = $scope.recentUploads.slice(0, 3);

      $scope.refreshFeaturedContent();
    }, function (err) {
      console.log(err);
    });


  // Wait for stats data to arrive
  $scope.statsData = {};
  $scope.statsData.isLoading = true;

  $http.get(`/app/account/stats?account=${encodeURIComponent($scope.account.accountName)}`).then(function (response) {
    $scope.statsData.stats = response.data;
    $scope.statsData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  // Wait for activity chart data to arrive
  $scope.activityData = {};
  $scope.activityData.isLoading = true;

  $http.get(`/app/account/activity?account=${encodeURIComponent($scope.account.accountName)}`).then(function (response) {
    $scope.activityData.entries = response.data;
    $scope.activityData.isLoading = false;
  }, function (err) {
    console.log(err);
  });

  $scope.collectionsData = {};
  $scope.collectionsData.isLoading = true;

  if (!$scope.account.isOwn) {
    $http.get(`/app/account/collections?account=${encodeURIComponent($scope.account.accountName)}`)
      .then(function (response) {

        $scope.collectionsData.collections = response.data;
        $scope.collectionsData.isLoading = false;
        $scope.refreshFeaturedContent();
      }, function (err) {
        console.log(err);
      });
  } else {

    function onCollectionManagerInitialized() {
      for (let guid in $scope.collectionManager.local) {
        let collection = $scope.collectionManager.local[guid];

        if(collection.accountName == undefined && collection.uri != undefined) {
          collection.accountName = DatabusUtils.getFirstSegment(collection.uri);
        }

        if (collection.accountName == $scope.accountName) {
          $scope.collectionList.push(collection);
        }
      }
    }

    $scope.collectionList = [];

    if(collectionManager.isInitialized) {
      onCollectionManagerInitialized();
    } else {
      collectionManager.subscribeOnInitialized(onCollectionManagerInitialized);
    }
  }



  $scope.getImageUrl = function () {
    if ($scope.account.imageUrl == undefined) {
      return DEFAULT_IMAGE;
    } else {
      return $scope.account.imageUrl;
    }
  }

  /**
   * COLLECTION FUNCTIONS 
   */

  // Collection List Search
  $scope.collectionSearch = {};
  $scope.collectionSearch.sortVisible = false;
  $scope.collectionSearch.sortProperty = 'title';
  $scope.collectionSearch.sortProperties = [
    { key: 'title', label: 'Title' },
    { key: 'issued', label: 'Issued Date' },
  ];
  $scope.collectionSearch.sortReverse = false;
  $scope.collectionSearch.toggleSort = function (value) {
    if ($scope.collectionSearch.sortProperty == value) {
      $scope.collectionSearch.sortReverse = !$scope.collectionSearch.sortReverse;
    } else {
      $scope.collectionSearch.sortProperty = value;
    }
  }

  $scope.homeTree = [];

  $scope.filterHome = function () {
    var groups = $scope.publishedData.groups || [];
    var query = ($scope.homeSearch.input || '').trim();
    var groupHits = {};
    var artifactHits = {};

    if (query) {
      fuzzysort.go(query, groups, { keys: ['title', 'name'], threshold: 0, limit: 0 }).forEach(function (hit) {
        groupHits[hit.obj.uri] = hit;
      });
      var artifacts = [];
      groups.forEach(function (group) {
        (group.artifacts || []).forEach(function (artifact) { artifacts.push(artifact); });
      });
      fuzzysort.go(query, artifacts, { keys: ['title', 'name', 'abstract'], threshold: 0, limit: 0 }).forEach(function (hit) {
        if (!artifactHits[hit.obj.group]) artifactHits[hit.obj.group] = [];
        artifactHits[hit.obj.group].push(hit);
      });
    }

    $scope.homeTree = groups.filter(function (group) {
      return !query || groupHits[group.uri] || artifactHits[group.uri];
    }).map(function (group) {
      var childHits = artifactHits[group.uri] || [];
      var groupHit = groupHits[group.uri];
      var segment = group.name || DatabusUtils.uriToResourceName(group.uri);
      var artifacts = (query && childHits.length ? childHits : (group.artifacts || []).map(function (artifact) {
        return { obj: artifact };
      })).map(function (hit) {
        var artifactSegment = hit.obj.name || DatabusUtils.uriToResourceName(hit.obj.uri);
        var artifactTitle = hit.obj.title || artifactSegment;
        return {
          uri: hit.obj.uri,
          latestVersion: hit.obj.latestVersion,
          latestVersionUri: hit.obj.latestVersionUri,
          labelHtml: $sce.trustAsHtml(highlightHtml(hit[0], artifactTitle)),
          segmentHtml: $sce.trustAsHtml(highlightHtml(hit[1] || hit[0], artifactSegment))
        };
      });
      return {
        group: group,
        labelHtml: $sce.trustAsHtml(highlightHtml(groupHit && groupHit[0], group.title)),
        segmentHtml: $sce.trustAsHtml(highlightHtml(groupHit && (groupHit[1] || groupHit[0]), segment)),
        artifacts: artifacts
      };
    });
  }

  $scope.groupSearch = { input: '', results: [] };

  $scope.filterGroups = function () {
    var groups = $scope.publishedData.groups || [];
    var query = ($scope.groupSearch.input || '').trim();
    var hits = query
      ? fuzzysort.go(query, groups, { keys: ['title', 'name', 'abstract'], threshold: 0, limit: 0 })
      : groups.map(function (group) { return { obj: group }; });

    $scope.groupSearch.results = hits.map(function (hit) {
      var group = hit.obj;
      return {
        group: group,
        titleHtml: highlightHtml(hit[0], group.title),
        abstractHtml: group.abstract ? highlightHtml(hit[2], group.abstract) : ''
      };
    });
  }

  $scope.groupForm = { open: false, saving: false, name: '', title: '', abstract: '', description: '', error: '' };

  $scope.toggleNewGroupForm = function () {
    $scope.groupForm.open = !$scope.groupForm.open;
    $scope.groupForm.error = '';
  }

  $scope.submitNewGroup = async function () {
    var name = ($scope.groupForm.name || '').trim();
    $scope.groupForm.error = '';

    if (!DatabusUtils.isValidGroupName(name)) {
      $scope.groupForm.error = 'Name must be 3–50 characters: letters, numbers, _, -, or .';
      return;
    }

    if (!$scope.publishedData.groups) {
      $scope.publishedData.groups = [];
    }

    var groups = $scope.publishedData.groups;
    if (groups.some(function (group) { return group.name === name; })) {
      $scope.groupForm.error = 'A group with this name already exists.';
      return;
    }

    $scope.groupForm.saving = true;
    $scope.groupForm.name = name;

    try {
      var creator = new DataIdCreator({ group: $scope.groupForm }, $scope.account.accountName);
      var response = await $http.post('/api/register', creator.createGroupUpdate());

      if (response.status == 200) {
        $scope.publishedData.groups.push({
          uri: DATABUS_RESOURCE_BASE_URL + '/' + $scope.account.accountName + '/' + name,
          name: name,
          title: DatabusUtils.stringOrFallback($scope.groupForm.title, name),
          abstract: $scope.groupForm.abstract,
          description: $scope.groupForm.description,
          artifacts: []
        });
        $scope.groupForm = { open: false, saving: false, name: '', title: '', abstract: '', description: '', error: '' };
        $scope.filterGroups();
        $scope.filterHome();
        DatabusAlert.alert($scope, true, 'Group created');
      }
    } catch (err) {
      var log = err && err.data && err.data.log;
      var entry = Array.isArray(log) ? log.find(function (item) { return item.msg; }) : null;
      $scope.groupForm.error = entry ? entry.msg : 'Could not create group.';
      $scope.groupForm.saving = false;
      DatabusAlert.alert($scope, false, $scope.groupForm.error);
    }

    $scope.$applyAsync();
  }

  /**
   * Pencil icon for edit pressed
   * @param {*} collection 
   */
  $scope.onEditCollectionClicked = function (collection) {
    $scope.collectionManager.setActive(collection.uuid);
    window.location.href = `/app/collection-editor?uuid=${collection.uuid}`;
  }

  /**
   * Create new collection
   */
  $scope.createNewCollection = function () {
    $scope.collectionManager.createNew($scope.accountName, 'New Collection', 'Replace this description with a description of your choice.',
      function (collection) {
        window.location.href = `/app/collection-editor?uuid=${collection.uuid}`;
      });
  }

  /**
   * Create a copy of the clicked collection
   */
  $scope.createCopy = function (collection) {
    let copy = $scope.collectionManager.createCopy(collection);
    window.location.href = `/app/collection-editor?uuid=${copy.uuid}`;
  }


  $scope.findFeaturedContent = function (uri) {

    for (var g in $scope.publishedData.groups) {
      var group = $scope.publishedData.groups[g];

      if (uri == group.uri) {
        return {
          type: 'Group',
          title: group.title,
          uri: uri,
          description: group.description
        }
      }

      for (var a in group.artifacts) {
        var artifact = group.artifacts[a];

        if (uri == artifact.artifactUri) {
          return {
            type: 'Artifact',
            title: artifact.title,
            uri: uri,
            description: artifact.description
          }
        }
      }
    }

    for (var c in $scope.collectionsData.collections) {
      var collection = $scope.collectionsData.collections[c];

      if (uri == collection.uri) {
        return {
          type: 'Collection',
          title: collection.title,
          uri: uri,
          description: collection.description
        }
      }
    }

  }

  $scope.refreshFeaturedContent = function () {
    if ($scope.account.featuredContent == undefined) {
      return;
    }

    var featuredContentUris = $scope.account.featuredContent.split('\n');
    $scope.featuredContent = [];

    for (var f in featuredContentUris) {
      var content = $scope.findFeaturedContent(featuredContentUris[f]);

      if (content != undefined) {
        $scope.featuredContent.push(content);
      }
    }
  }

  /** ACCOUNT MANAGEMENT FOR OWNER */

}

module.exports = AccountPageController;