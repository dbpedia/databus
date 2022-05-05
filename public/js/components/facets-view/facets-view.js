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
    ctrl.viewModel = {};

    if (ctrl.facets == undefined) {
      ctrl.facets = [];
    }

    var queryUri = ctrl.resourceType == 'version' ?
      ctrl.node.uri + '/' + ctrl.node.facetSettings['http://purl.org/dc/terms/hasVersion'][0].value
      : ctrl.node.uri;

    // Load the available resource facets
    // TODO: Remove resource type, can be derived from uri
    ctrl.$http.get('/app/utils/facets', {
      params: { uri: queryUri, type: ctrl.resourceType }
    }).then(function (result) {

      // Facets data has been loaded
      ctrl.isLoading = false;

      // Fix artifact facet values for groups
      if (ctrl.resourceType == 'group') {
        for (var i in result.data["http://dataid.dbpedia.org/ns/core#artifact"].values) {
          var value = result.data["http://dataid.dbpedia.org/ns/core#artifact"].values[i];
          result.data["http://dataid.dbpedia.org/ns/core#artifact"].values[i]
            = DatabusCollectionUtils.uriToName(value);
        }
      }

      // Facet setting in this view is

      // - SETTING
      // ---- VALUE
      // ---- IS_CHECKED

      // Prepare visible facet settings and autofill data based on the facet data returned by the API
      // Create key base entries (unset, not overriden)
      for (var key in result.data) {

        var facetData = result.data[key];

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

          var facetSetting = {
            value: value,
            checked: false,
            isOverride: false
          };

          ctrl.viewModel[key].visibleFacetSettings.push(facetSetting);

          if (v >= ctrl.maxEntries - 1)
            break;
        }
      }

      // Add the "Latest Version" facet to the visible settings of the version facet
      if (ctrl.resourceType != 'version') {
        ctrl.viewModel[FACET_VERSION_KEY].visibleFacetSettings.unshift({
          value: FACET_LATEST_VERSION_VALUE,
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

        if (ctrl.resourceType == 'version') {

          delete ctrl.viewModel[FACET_VERSION_KEY];

        }

        // If we're a group node, check for artifact nodes and add them as facets
        if (ctrl.resourceType == 'group') {
          for (var i in ctrl.node.childNodes) {
            var artifactNode = ctrl.node.childNodes[i];
            var facetValue = DatabusCollectionUtils.uriToName(artifactNode.uri)
            var visibleFacetSetting =
              ctrl.getOrCreateVisibleFacetSetting('http://dataid.dbpedia.org/ns/core#artifact', facetValue);
            visibleFacetSetting.checked = true;
            visibleFacetSetting.isOverride = true;
          }
        }

        ctrl.onLoaded();
      }
    });
  }

  ctrl.getFacetLabel = function (value) {
    if (value == FACET_LATEST_VERSION_VALUE) {
      return FACET_LATEST_VERSION_LABEL;
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

    if (ctrl.resourceType == 'group' && key == 'http://dataid.dbpedia.org/ns/core#artifact') {

      var childUri = ctrl.node.uri + '/' + value;

      if (targetState) {
        var artifactNode = new QueryNode(childUri, 'dataid:artifact');
        QueryNode.addChild(ctrl.node, artifactNode);
      } else {
        QueryNode.removeChildByUri(ctrl.node, childUri);
      }

      var visibleSetting = ctrl.getOrCreateVisibleFacetSetting(key, value);

      if (visibleSetting != null) {
        visibleSetting.checked = targetState;
        visibleSetting.isOverride = targetState;
      }
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

      var label = DatabusCollectionUtils.uriToName(key);
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


