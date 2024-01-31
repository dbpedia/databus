const QueryNode = require("../../query-builder/query-node");
const DatabusConstants = require("../../utils/databus-constants");
const DatabusUris = require("../../utils/databus-uris");
const DatabusUtils = require("../../utils/databus-utils");

/**
 * Manages an array of facets with respect to a parent facets array.
 * Provides some convenient\ce methods to write to the facets array and
 * read from the parents facets.
 * DO NOT change the parent facets array in here.
 */
class FacetSettings {

  /**
   * Locally manages a facets array with respect to a parent
   * facets array
   * @param {[type]} facets       [description]
   * @param {[type]} parentFacets [description]
   */
  constructor(facets, parentFacets) {
    this.facets = facets;
    this.parentFacets = parentFacets;
  }

  /**
   * Change a setting (key, value) to a state (bool)
   * @param  {[type]} key    [description]
   * @param  {[type]} value    [description]
   * @param  {[type]} setState [description]
   * @return {[type]}          [description]
   */
  changeSetting(key, value, targetState) {
    var parentState = this.findParentSettingState(key, value);

    if (parentState != targetState) {
      this.createOrAddSetting(key, value, targetState);
    } else {
      this.removeSetting(key, value);
    }

    return targetState;
  }

  /**
   * Find the checked state specified in the parent setting array (if set)
   * based on a key and value
   * @param  {[type]} key [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  findParentSettingState(key, value) {
    if (this.parentFacets == undefined) {
      return false;
    }

    for (var p in this.parentFacets) {
      var setting = this.parentFacets[p];
      if (setting.key == key && setting.value == value) {
        return setting.checked;
      }
    }

    return false;
  }

  findOwnSettingState(key, value) {
    for (var p in this.facets) {
      var setting = this.facets[p];
      if (setting.key == key && setting.value == value) {
        return setting.checked;
      }
    }

    return false;
  }

  isOverride(key, value, state) {
    var parentState = this.findParentSettingState(key, value);
    return parentState != state;
  }

  createOrAddSetting(key, value, state) {
    for (var p in this.facets) {
      var setting = this.facets[p];
      if (p == key && setting.value == value) {
        setting.checked = state;
        return;
      }
    }

    this.facets[key] = { value: value, checked: state };
  }

  removeSetting(key, value) {
    for (var p in this.facets) {
      var setting = this.facets[p];
      if (setting.key == key && setting.value == value) {
        this.facets.splice(p, 1);
        return;
      }
    }
  }

}

function FacetsViewController($http, $scope) {

  var ctrl = this;
  ctrl.$http = $http;
  ctrl.maxEntries = 6;

  ctrl.$onInit = function () {

  }

  ctrl.$onChanges = function () {
    // create the queries...
    ctrl.isLoading = true;

    // wrap the node in the query node class
    ctrl.node = QueryNode.createFrom(ctrl.node);

    // Holds the view state as json
    ctrl.viewModel = {};

    if (ctrl.facets == undefined) {
      ctrl.facets = [];
    }

    var queryUri = ctrl.resourceType == 'version' ?
      ctrl.node.uri + '/' + ctrl.node.facetSettings[DatabusUris.DCT_HAS_VERSION][0].value
      : ctrl.node.uri;

    // Load the available resource facets
    // TODO: Remove resource type, can be derived from uri
    ctrl.$http.get('/app/utils/facets', {
      params: { uri: queryUri, type: ctrl.resourceType }
    }).then(function (result) {

      // Facets data has been loaded
      ctrl.facetsData = result.data;

      // Fix artifact facet values for groups, change URIs into artifact names
      var artifactFacetData = ctrl.facetsData[DatabusUris.DATABUS_ARTIFACT_PROPERTY];

      if (artifactFacetData != null) {
        for (var i in artifactFacetData.values) {
          artifactFacetData.values[i] = DatabusUtils.uriToName(artifactFacetData.values[i]);
        }
      }

      // Facet setting in this view is

      // - SETTING
      // ---- VALUE
      // ---- IS_CHECKED

      // Prepare visible facet settings and autofill data based on the facet data returned by the API
      // Create key base entries (unset, not overriden)
      for (var key in ctrl.facetsData) {

        var facetData = ctrl.facetsData[key];

        // Create a view data object for each facet
        ctrl.viewModel[key] = {};
        ctrl.viewModel[key].key = key;
        ctrl.viewModel[key].label = facetData.label;
        ctrl.viewModel[key].visibleFacetSettings = [];
        ctrl.viewModel[key].autofill = {};
        ctrl.viewModel[key].autofill.values = facetData.values;
        ctrl.viewModel[key].autofill.selectedValues = [];
        ctrl.viewModel[key].autofill.input = '';


        for (var v in facetData.values) {
          var value = facetData.values[v];
          ctrl.viewModel[key].visibleFacetSettings.push({
            value: value,
            checked: false,
            isOverride: false
          });
        }

        ctrl.viewModel[key].visibleFacetSettings.sort(function (a, b) {
          const valueA = a.value.toUpperCase();
          const valueB = b.value.toUpperCase();
          if (valueA > valueB) {
            return 1;
          }
          if (valueA < valueB) {
            return -1;
          }

          return 0;
        });

        // Show latest versions first
        if (key == DatabusUris.DCT_HAS_VERSION) {
          ctrl.viewModel[key].visibleFacetSettings.reverse();
        }

        // Only show the top few
        var length = ctrl.viewModel[key].visibleFacetSettings.length;
        ctrl.viewModel[key].visibleFacetSettings.length = Math.min(ctrl.maxEntries, length);
      }

      // If we show the browser for a version, remove the version facet
      if (ctrl.resourceType == 'version') {
        delete ctrl.viewModel[DatabusUris.DCT_HAS_VERSION];
      }

      // Add the "Latest Version" facet to the visible settings of the version facet
      if (ctrl.resourceType != 'version' && ctrl.viewModel[DatabusUris.DCT_HAS_VERSION] != undefined) {
        ctrl.viewModel[DatabusUris.DCT_HAS_VERSION].visibleFacetSettings.unshift({
          value: DatabusConstants.FACET_LATEST_VERSION_VALUE,
          checked: false,
          isOverride: false
        });

        // Apply the existing settings to the view model
        var fullFacets = ctrl.node.createFullFacetSettings();

        for (var key in fullFacets) {
          var facetSettingList = fullFacets[key];

          for (var i in facetSettingList) {
            var facetSetting = facetSettingList[i];

            var visibleFacetSetting = ctrl.getOrCreateVisibleFacetSetting(key, facetSetting.value);

            if (visibleFacetSetting != null) {
              visibleFacetSetting.checked = facetSetting.checked;
              visibleFacetSetting.isOverride = ctrl.node.isOverride(key, facetSetting.value, facetSetting.checked);
            }
          }
        }

        // If we're a group node, check for artifact nodes and add them as facets
        if (ctrl.resourceType == 'group') {

          for (var i in ctrl.node.childNodes) {
            var artifactNode = ctrl.node.childNodes[i];
            var facetValue = DatabusUtils.uriToName(artifactNode.uri)
            var visibleFacetSetting =
              ctrl.getOrCreateVisibleFacetSetting(DatabusUris.DATABUS_ARTIFACT_PROPERTY, facetValue);
            visibleFacetSetting.checked = true;
            visibleFacetSetting.isOverride = true;
          }

          if (ctrl.node.childNodes.length == 0) {


            ctrl.updateArtifactFilters(ctrl.node);

            var artifactFacetData = ctrl.facetsData[DatabusUris.DATABUS_ARTIFACT_PROPERTY];

            if (artifactFacetData != null) {

              // Add artifact nodes 
              for (var i in artifactFacetData.values) {
                artifactFacetData.values[i] = DatabusUtils.uriToName(artifactFacetData.values[i]);
              }
            }

            /*
            // Add artifact nodes per default
            for (var v of ctrl.viewModel[DatabusUris.DATABUS_ARTIFACT_PROPERTY].visibleFacetSettings) {
              var childUri = ctrl.node.uri + '/' + v.value;
              var artifactNode = new QueryNode(childUri, 'databus:artifact');
              QueryNode.addChild(ctrl.node, artifactNode);
            }*/


          }
        }

        ctrl.onChange();
        ctrl.onLoaded();
      }

      ctrl.isLoading = false;
    });
  }

  ctrl.updateArtifactFilters = function (groupNode) {

      // Clear all child nodes
    groupNode.childNodes.length = 0;

    var hasCheckedArtifactFacets = false;

    for (var setting of ctrl.viewModel[DatabusUris.DATABUS_ARTIFACT_PROPERTY].visibleFacetSettings) {
      hasCheckedArtifactFacets = hasCheckedArtifactFacets || setting.checked;
    }

    if (hasCheckedArtifactFacets) {

      for (var setting of ctrl.viewModel[DatabusUris.DATABUS_ARTIFACT_PROPERTY].visibleFacetSettings) {
        if (setting.checked) {
          var artifactUri = `${groupNode.uri}/${setting.value}`;
          if (QueryNode.findChildByUri(groupNode, artifactUri) == null) {
            var artifactNode = new QueryNode(artifactUri, 'databus:artifact');
            QueryNode.addChild(groupNode, artifactNode);
          }
        }
      }

    } else {

      var latestVersionSetting = QueryNode.findFacetSetting(groupNode,
        DatabusUris.DCT_HAS_VERSION,
        DatabusConstants.FACET_LATEST_VERSION_VALUE);

      if (latestVersionSetting != undefined && latestVersionSetting.checked) {

        var artifactFacetData = ctrl.facetsData[DatabusUris.DATABUS_ARTIFACT_PROPERTY];

        if (artifactFacetData != null) {

          // Add artifact nodes 
          for (var value of artifactFacetData.values) {
            var artifactUri = `${groupNode.uri}/${value}`;
            if (QueryNode.findChildByUri(groupNode, artifactUri) == null) {
              var artifactNode = new QueryNode(artifactUri, 'databus:artifact');
              QueryNode.addChild(groupNode, artifactNode);
            }
          }

        }
      }
    }

  }


  ctrl.getFacetLabel = function (value) {
    if (value == DatabusConstants.FACET_LATEST_VERSION_VALUE) {
      return DatabusConstants.FACET_LATEST_VERSION_LABEL;
    }

    return value;
  }
  /**
   * Changes the value of a key value (also applies to facets)
   * @param  {[type]} key [description]
   * @param  {[type]} value [description]
   * @param  {[type]} state [description]
   * @return {[type]}       [description]
   */
  ctrl.changeFacetValueState = function (key, value, targetState) {

    if (ctrl.resourceType == 'group' && key == DatabusUris.DATABUS_ARTIFACT_PROPERTY) {

      var visibleSetting = ctrl.getOrCreateVisibleFacetSetting(key, value);

      if (visibleSetting != null) {
        visibleSetting.checked = targetState;
        visibleSetting.isOverride = targetState;
      }

      ctrl.updateArtifactFilters(ctrl.node);

    }
    else {
      // apply change to view model
      ctrl.node.setFacet(key, value, targetState);

      var visibleSetting = ctrl.getOrCreateVisibleFacetSetting(key, value);

      if (visibleSetting != null) {
        visibleSetting.checked = targetState;
        visibleSetting.isOverride = ctrl.node.isOverride(key, value, targetState);
      }
    }

    if (ctrl.viewModel[key].autofill.selectedValues.length > 0) {
      ctrl.complete(ctrl.viewModel[key]);
    }

    ctrl.onChange();
  }

  /**
   * Gets or creates a new entry for a key value
   * for a given key and value
   * @param  {[type]} key [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  ctrl.getOrCreateVisibleFacetSetting = function (key, value) {

    if (ctrl.viewModel[key] == undefined) {
      // This is a facet that the node does not have, but a parent has

      var label = DatabusUtils.uriToName(key);
      label = label[0].toUpperCase() + label.slice(1);

      ctrl.viewModel[key] = {};
      ctrl.viewModel[key].key = key;
      ctrl.viewModel[key].label = label;
      ctrl.viewModel[key].visibleFacetSettings = [];
      ctrl.viewModel[key].autofill = {};
      ctrl.viewModel[key].autofill.values = [];
      ctrl.viewModel[key].autofill.selectedValues = [];
      ctrl.viewModel[key].autofill.input = '';
    }

    for (var i in ctrl.viewModel[key].visibleFacetSettings) {
      var facetSetting = ctrl.viewModel[key].visibleFacetSettings[i];
      if (facetSetting.value == value) {
        return facetSetting; // ctrl.facetSettings[key];
      }
    }

    var visibleSetting = {
      value: value,
    };

    ctrl.viewModel[key].visibleFacetSettings.push(visibleSetting);
    return visibleSetting;
  }

  // Get all active facets of a certain key
  ctrl.getActiveFilters = function (key) {
    var activeFilters = [];

    for (var f in ctrl.facets[key].items) {
      var filter = ctrl.facets[key].items[f];
      if (filter.checked) {
        activeFilters.push(filter);
      }
    }

    return activeFilters;
  }

  // Checks whether any filter for a key is set
  ctrl.hasActiveFilters = function (key) {
    for (var f in ctrl.facets[key].items) {
      var filter = ctrl.facets[key].items[f];
      if (filter.checked) {
        return true;
      }
    }

    return false;
  }

  ctrl.complete = function (facetData) {
    facetData.autofill.selectedValues.length = 0;
    for (var a in facetData.autofill.values) {
      var e = facetData.autofill.values[a];
      if (e.toLowerCase().indexOf(facetData.autofill.input.toLowerCase()) >= 0) {

        var include = true;

        for (var v in facetData.visibleFacetSettings) {
          var visibleSettings = facetData.visibleFacetSettings[v];
          if (visibleSettings.value == e.toLowerCase()) {
            include = false;
          }
        }

        if (include) {
          facetData.autofill.selectedValues.push(e);
        }
      }
    }
  }

  // Clears the autofill lists
  ctrl.clearAutofill = function () {
    var self = ctrl;
    for (var f in self.viewModel) {
      var data = self.viewModel[f];
      data.autofill.selectedValues.length = 0;
    }
  }
}

module.exports = FacetsViewController;
