// hinzufügen eines Controllers zum Modul
function CollectionSearchController(collectionManager, $http, $interval, $sce) {

  var ctrl = this;

  ctrl.results = [];
  ctrl.collectionManager = collectionManager;



  



  ctrl.formatResult = function (result) {
    return $sce.trustAsHtml(result);
  }

  ctrl.getDatabusUrls = function () {

    if (ctrl.databusUrls != undefined) {
      return ctrl.databusUrls;
    }

    ctrl.databusUrls = [];
    var root = ctrl.collection.content.root;

    for (var sourceNode of root.childNodes) {
      ctrl.databusUrls.push(sourceNode.uri);
    }

    return ctrl.databusUrls;
  }

  ctrl.$onInit = function () {

    ctrl.searchInput = '';
    ctrl.filters = {};
    ctrl.filters.filterArtifact = false;
    ctrl.filters.filterGroup = false;
    ctrl.searchCooldown = 1000;

    ctrl.root = QueryNode.createFrom(ctrl.collection.content.root);

    ctrl.collectionWrapper = new DatabusCollectionWrapper(ctrl.collection);
    ctrl.autoFocus = true;
  }

  // TODO Fabian
  ctrl.isInCollection = function (result) {
    let uri = result.resource[0].value;
    let node = QueryNode.findChildByUri(ctrl.root, uri);

    return node != null;
  }


  ctrl.addToCollection = function (result) {

    var currentSource = ctrl.targetDatabusUrl;
    var sourceNode = QueryNode.findChildByUri(ctrl.root, currentSource);

    if (result.inCollection) {
      QueryNode.removeChildByUri(ctrl.root, result.resource[0].value);
      // ctrl.onComponentAdded();
      // ctrl.collectionManager.saveLocally();
    }
    else {
      if (result.typeName[0].value == 'Group') {
        let node = new QueryNode(result.resource[0].value, 'dataid:group');

        sourceNode.addChild(node);
        ctrl.onComponentAdded();
      }

      if (result.typeName[0].value == 'Artifact') {

        var artifactUri = result.resource[0].value;
        let groupUri = DatabusCollectionUtils.navigateUp(artifactUri);
        let groupNode = QueryNode.findChildByUri(ctrl.root, groupUri);

        if (groupNode == null) {
          groupNode = new QueryNode(groupUri, 'dataid:group');
          sourceNode.addChild(groupNode);
        }

        let node = new QueryNode(artifactUri, 'dataid:artifact');
        groupNode.addChild(node);

        ctrl.onComponentAdded();
      }
    }

    // check if a group has no children left, if yes, remove it as well
    //for(let r in ctrl.root.childNodes) {
    //  if (ctrl.root.childNodes[r].property === "dataid:group" && ctrl.root.childNodes[r].childNodes.length === 0) {
    //    QueryNode.removeChildByUri(ctrl.root, ctrl.root.childNodes[r].uri);
    //  }
    // }

    for (let r in ctrl.results) {
      ctrl.results[r].inCollection = ctrl.isInCollection(ctrl.results[r]);
    }

    ctrl.collectionManager.saveLocally();

    console.log(ctrl.root);
  }

  $interval(function () {

    if (ctrl.searchChanged) {

      if (!DatabusUtils.isValidHttpUrl(ctrl.targetDatabusUrl)) {
        return;
      }

      var typeFilters = '?typeName=Artifact Group';

      if (ctrl.filters.filterArtifact || ctrl.filters.filterGroup) {

        typeFilters = '?typeName='
        if (ctrl.filters.filterArtifact) {
          typeFilters += 'Artifact ';
        }
        if (ctrl.filters.filterGroup) {
          typeFilters += 'Group ';
        }
      }

      ctrl.lastQuery = ctrl.searchInput;

      try {

        $http({
          method: 'GET',
          url: ctrl.targetDatabusUrl + '/api/search' + typeFilters + '&format=JSON_FULL&minRelevance=10&maxResults=50&query='
            + ctrl.searchInput,
        }).then(function successCallback(response) {

          if (ctrl.lastQuery != response.data.query) {
            return;
          }

          ctrl.results = response.data.docs;

          for (var r in ctrl.results) {
            ctrl.results[r].inCollection = ctrl.isInCollection(ctrl.results[r]);
          }

        }, function errorCallback(response) {
        });
      } catch (err) {

      }

      ctrl.searchChanged = false;
    };
  }, ctrl.searchCooldown);

  ctrl.search = function () {
    ctrl.searchChanged = true;
  };
}

