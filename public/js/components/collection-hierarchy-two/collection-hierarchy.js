// TODO fabian bug

// hinzufügen eines Controllers zum Modul
function CollectionHierarchyControllerTwo($http, $location, $sce, $scope) {

  var ctrl = this;

  ctrl.viewMode = -1;
  ctrl.$http = $http;
  ctrl.$scope = $scope;


  ctrl.$onInit = function () {

    ctrl.viewMode = -1;
    ctrl.queryBuilder = new QueryBuilder();

    if (ctrl.collection == null) {
      return;
    }
  }
  

  ctrl.isLastChild = function(group, artifact) {

    if(group.childNodes == undefined || group.childNodes.length == 0) {
      return false;
    }

    return group.childNodes[group.childNodes.length - 1].uri == artifact.uri;
  }

  ctrl.toggleExpand = function(node) {
    node.expanded = !node.expanded;
    ctrl.onChange();
  }

  ctrl.mergeFacets = function (node, facets) {

    if(node.facets == undefined) {
      node.facets = JSON.parse(JSON.stringify(facets));
      return;
    }

    for(var f in facets) {

      if(node.facets[f] == undefined) {
        node.facets[f] = JSON.parse(JSON.stringify(facets[f]));
        continue;
      }

      for(var value of facets[f].values) {
        if(!node.facets[f].values.includes(value)) {
          node.facets[f].values.push(value);
        }
      }
    }

    node.facetLabels = null;
  }

  ctrl.getAllFilters = function(groupNode, artifactNode) {
    var result = Object.keys(groupNode.facetSettings).concat(Object.keys(artifactNode.facetSettings));
    return DatabusUtils.uniqueList(result);
  }

  ctrl.$doCheck = function () {

    if (ctrl.collection == null) {
      ctrl.previousCollectionId = null;
      return;
    }


    if (ctrl.previousCollectionId != ctrl.collection.uuid) {
      ctrl.previousCollectionId = ctrl.collection.uuid;

      ctrl.activeNode = null;
      ctrl.viewMode = -1;
      ctrl.updateViewModel();
    }
  }



  ctrl.updateViewModel = function () {
    ctrl.collectionWrapper = new DatabusCollectionWrapper(ctrl.collection);

    ctrl.root = ctrl.collection.content.generatedQuery.root;

    ctrl.view = {};
    ctrl.view.groups = {};
    ctrl.view.artifacts = {};

    for (var g in ctrl.root.childNodes) {


      var groupNode = ctrl.root.childNodes[g];
      groupNode.expanded = true;


      ctrl.view.groups[groupNode.uri] = {};


      ctrl.$http.get('/system/pages/artifacts-by-group',
        { params: { uri: groupNode.uri } })
        .then(function (result) {
          ctrl.view.groups[groupNode.uri].artifacts = result.data;
        });

      ctrl.query(groupNode);

      for (var a in groupNode.childNodes) {

        var artifactNode = groupNode.childNodes[a];

        ctrl.view.artifacts[artifactNode.uri] = {};

        ctrl.$http.get('/system/pages/facets', {
          params: { uri: artifactNode.uri, type: 'artifact' }
        }).then(function (result) {

          var artifactUri = result.config.params.uri;
          var groupUri = DatabusUtils.navigateUp(artifactUri);
          ctrl.view.artifacts[artifactUri].facets = result.data;
          ctrl.mergeFacets(ctrl.view.groups[groupUri], result.data);
        });
      }
    }
  }



  ctrl.onArtifactDropdownChanged = function(groupNode) {
    ctrl.onChange();
    ctrl.query(groupNode);
  }

  ctrl.selectAddFilterValue = function (viewNode, value) {
    viewNode.addFilterValueInput = value;
    viewNode.showValueDrop = false;

    ctrl.onAddFilterValueInputChanged(viewNode);
  }

  ctrl.selectAddFilterFacet = function (viewNode, value) {
    viewNode.addFilterFacetInput = value;
    viewNode.showFacetDrop = false;

    ctrl.onAddFilterFacetInputChanged(viewNode);
  }

  ctrl.onAddFilterValueInputChanged = function (viewNode) {

    for (var value of viewNode.facets[viewNode.addFilterFacet].values) {

      if (viewNode.addFilterValueInput == value) {
        viewNode.addFilterValue = value;
        return;
      }
    }

    viewNode.addFilterValue = null;
  }

  ctrl.onAddFilterFacetInputChanged = function (viewNode) {

    for (var facet in viewNode.facets) {

      if (viewNode.addFilterFacetInput == viewNode.facets[facet].label) {

        if (viewNode.addFilterFacet != facet) {
          viewNode.addFilterFacet = facet;
          viewNode.addFilterValue = [];
        }

        return;
      }
    }

    viewNode.addFilterFacet = null;
    viewNode.addFilterValue = [];
  }

  ctrl.includesValue = function(objs, value) {
    if(objs == undefined) {
      return false;
    }

    for(var obj of objs) {
      if(obj.value == value) {
        return true;
      }
    }

    return false;
  }

  ctrl.addFilter = function (node, facet, values, checked) {

    if(values == null || values.length == 0) {
      return;
    }

    if (node.facetSettings[facet] == undefined) {
      node.facetSettings[facet] = [];
    }

    for(var value of values) {

      if(!ctrl.includesValue(node.facetSettings[facet], value.value)) {
        node.facetSettings[facet].push(value);
      }
    }

    ctrl.onChange();
    ctrl.query(node);
  }

  ctrl.query = function(node) {

    if(node.childNodes != undefined && node.childNodes.length > 0) {
      
      node.files = null;
      for(var child of node.childNodes) {
        ctrl.query(child);
      }

      return;    
    }

    var queryNode = QueryNode.createSubTree(node);
    var fullQuery = ctrl.queryBuilder.createQuery(queryNode, DATABUS_QUERIES.nodeFileList, 
      '%COLLECTION_QUERY%', 2 );
    
    this.querySparql(fullQuery).then(function(result) {
      node.files = result;
      ctrl.$scope.$apply(); 

    });
  }

  ctrl.removeFilter = function (node, facet) {

    if (node.facetSettings[facet] == undefined) {
      return;
    }

    delete node.facetSettings[facet];

    ctrl.onChange();
    ctrl.query(node);
  }

  ctrl.onActiveFilterChanged = function(node) {
    ctrl.onChange();
    ctrl.query(node);
  }
  
  ctrl.getFacetLabels = function(viewNode) {

    if(viewNode.facetLabels != undefined) {
      return viewNode.facetLabels;
    }
    var result = [];

    for(var f in viewNode.facets) {
      result.push(viewNode.facets[f].label);
    }

    viewNode.facetLabels = result;
    return result;
  }


  ctrl.sortBy = function (property) {

    if (ctrl.sortProperty == property) {
      ctrl.sortReverse = !ctrl.sortReverse;
    }
    ctrl.sortProperty = property;
  }

  ctrl.formatFileSize = function (size) {
    return DatabusUtils.formatFileSize(size);
  };

  ctrl.toHTML = function (html) {
    return $sce.trustAsHtml(html);
  };

  ctrl.onComponentAdded = function () {
    
  }

  ctrl.customExpanded = function () {
    return ctrl.customNode.expanded && ctrl.collection.content.customQueries.length > 0;
  }

  ctrl.generatedExpanded = function () {
    return ctrl.generatedNode.expanded && ctrl.collection.content.groups.length > 0;
  }

  ctrl.publishCollection = function () {
    ctrl.onPublish();
  }

  ctrl.delete = function () {
    ctrl.onDelete();
  }

  ctrl.goToResource = function (node) {
    window.location = node.uri;
  }

  ctrl.formatGroupPrefix = function (uri) {
    return DatabusCollectionUtils.uriToName(DatabusCollectionUtils.navigateUp(uri));
  }

  ctrl.formatArtifactPrefix = function (uri) {
    var nav = DatabusCollectionUtils.navigateUp(uri);
    var groupName = DatabusCollectionUtils.uriToName(nav);
    var userName = DatabusCollectionUtils.uriToName(DatabusCollectionUtils.navigateUp(nav));

    return userName + '/' + groupName;
  }

  ctrl.uriToName = function (uri) {
    return DatabusCollectionUtils.uriToName(uri);
  }

  ctrl.objSize = function(obj) {
    return DatabusUtils.objSize(obj);
  }

  ctrl.showCollectionSearch = function () {
    ctrl.open = false;
    ctrl.viewMode = 0;
    ctrl.activeNode = ctrl.rootNode;

    $location.hash('search');
  }

  // ctrl.printJSON = function() {
  //   console.log(JSON.stringify(ctrl.collection));
  // }

  // SHOW NODES
  ctrl.showGroupNode = function (groupNode) {
    ctrl.open = true;
    ctrl.viewMode = 3;
    ctrl.activeNode = QueryNode.createFrom(groupNode);

    this.updateQuery();
  }

  ctrl.showArtifactNode = function (artifactNode, groupNode) {

    ctrl.open = true;
    ctrl.viewMode = 1;
    ctrl.activeNode = QueryNode.createFrom(artifactNode);

    this.updateQuery();
  }

  ctrl.querySparql = async function(query) {


    try {

      var req = {
        method: 'POST',
        url: DATABUS_SPARQL_ENDPOINT_URL,
        data: "format=json&query=" + encodeURIComponent(query),
        headers: {
          "Content-type" : "application/x-www-form-urlencoded"
        },
      }

      var updateResponse = await ctrl.$http(req); 

      var data = updateResponse.data;
      var bindings = data.results.bindings;

      for(var b in bindings) {
        ctrl.reduceBinding(bindings[b]);
      }

      return bindings;
      

    } catch(e) {
      console.log(e);
    }
  }

  ctrl.reduceBinding =function(binding) {
    for (var key in binding) {
       binding[key] = binding[key].value;
    }
 
    return binding;
 }
 


  ctrl.updateQuery = function () {
    var queryNode = QueryNode.createSubTree(ctrl.activeNode);
    ctrl.activeFileQuery = ctrl.queryBuilder.createFileQuery(queryNode);
    ctrl.activeFullQuery = ctrl.queryBuilder.createFullQuery(queryNode);
  }

  ctrl.onActiveNodeChanged = function () {
    this.updateQuery();

    ctrl.onChange();
  }

  ctrl.addCustomNode = function () {
    ctrl.collectionWrapper.addCustomQueryNode('Custom Query', 'PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n\
PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n\
PREFIX dct: <http://purl.org/dc/terms/>\n\
PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\
\n\
# Get all files\n\
SELECT DISTINCT ?file WHERE {\n\
  ?dataset dataid:artifact <https://databus.dbpedia.org/dbpedia/publication/strategy> .\n\
  ?dataset dcat:distribution ?distribution .\n\
  ?distribution dcat:downloadURL ?file .\n\
}');
    ctrl.customNode.expanded = true;

    ctrl.onChange();
  }

  ctrl.removeNode = function (node) {
    var parent = node.parent;
    
    ctrl.collectionWrapper.removeNodeByUri(node.uri);

    ctrl.query(parent);
    ctrl.onChange();
  }

  ctrl.showCustomQueryNode = function (customQueryNode) {
    ctrl.open = true;
    ctrl.viewMode = 2;
    ctrl.activeNode = customQueryNode;
  }

  ctrl.list = function(setting) {
    return setting.map(function(v) { return v.value }).join(', ');
  }
}


