class ArtifactFacetSettings {

  /**
   * Locally manages a settings array with respect to a parent
   * settings array
   * @param {[type]} settings       [description]
   * @param {[type]} parentSettings [description]
   */
  constructor(settings, parentSettings) {
    this.settings = settings;
    this.parentSettings = parentSettings;
  }

  /**
   * Change a setting (field, value) to a state (bool)
   * @param  {[type]} field    [description]
   * @param  {[type]} value    [description]
   * @param  {[type]} setState [description]
   * @return {[type]}          [description]
   */
  changeSetting(field, value, setState) {
    var parentState = findParentSettingState(field, value);

    if(parentState != setState) {
      createOrAddSetting(field, value, setState);
    } else {
      removeSetting(field, value);
    }
  }

  /**
   * Find the checked state specified in the parent setting array (if set)
   * based on a field and value
   * @param  {[type]} field [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  findParentSettingState(field, value) {
    if(this.parentSettings == undefined) {
      return false;
    }

    for(var p in this.parentSettings) {
      var setting = this.parentSettings[p];
      if(setting.field == field && setting.value == value) {
        return setting.checked;
      }
    }

    return false;
  }

  createOrAddSetting(field, value, state) {
    for(var p in this.settings) {
      var setting = this.settings[p];
      if(setting.field == field && setting.value == value) {
        setting.checked = state;
        return;
      }
    }

    this.settings.push({ field : field, value : value, checked : state });
  }

  removeSetting(field, value) {
    for(var p in this.settings) {
      var setting = this.settings[p];
      if(setting.field == field && setting.value == value) {
        this.settings.splice[p];
        return;
      }
    }
  }

}

class ArtifactFacetViewController {
  constructor(facetData) {

    this.facetData = facetData;

    this.facets = {};

    for(var f in facetData) {
      var facet = facetData[f];
      this.createFilterCategory(f, facet.label, facet.values);
    }

    this.maxEntries = 3;
    // autofill settings
    this.autofill = {};
    this.autofill.inputs = {};
    this.autofill.data = {};
    this.autofill.selected = {};

    // result settings
    this.queryResult = {};
    this.lastRequestRevision = 0;
    this.isLoading = false;
    this.tableLimit = 20;
    this.activeTab = 0;
    this.showMore = false;
    this.sortReverse = true;
    this.sortProperty = 'version.value';

    for(var s in this.facetSettings.settings) {
      var setting = this.facetSettings.settings[s];
      this.addFilter(setting.field, setting.value, setting.checked)
    }
  }

  useSettings(facetSettings) {
    this.facetSettings = facetSettings;

    for(var p in this.facetSettings.parentSettings) {
      var setting = this.facetSettings.parentSettings[p];

      var facet = this.getOrCreateFacet(settting.field, setting.value);
      facet.checked = setting.checked;
      facet.isOverride = false;
    }

    for(var p in this.facetSettings.settings) {
      var setting = this.facetSettings.settings[p];

      var facet = this.getOrCreateFacet(settting.field, setting.value);
      facet.checked = setting.checked;
      facet.isOverride = false;
    }
  }

  getOrCreateFacet(field, value) {
    if(this.facets[field].values[value] == undefined) {
      this.facets[field].values[value] =  {
        label: value,
        value: this.toRDFLiteral(value) + " ."
      }
    }
  }

  // Sort by property name
  sortBy(propertyName) {
    this.sortReverse = (this.sortProperty === propertyName) ? !this.sortReverse : false;
    this.sortProperty = propertyName;
  }

  // Clears the autofill lists after 50ms
  clearAutofill(callback) {
    var self = this;

    for(var f in self.autofill.selected) {
      self.autofill.selected[f].length = 0;
    }

    callback();
  }

  // Converts a string to an RDF literal
  toRDFLiteral(value) {
    return "\'" + value + "\'\^\^<http://www.w3.org/2001/XMLSchema#string>";
  }

  changeFacet(field, value, state) {
    this.facetSettings.changeSetting(field, value, state);

    this.facets[field].items[value].checked = state;
    this.facets[field].items[value].isOverride = this.facetSettings.isOverride(field, value);
  }

  // Create filter items based on a list of strings
  createFilterCategory(field, label, data) {

    var length = Math.min(this.maxEntries, data.length);

    this.facets[field] = {};
    this.facets[field].label = label;
    this.facets[field].key = field;
    this.facets[field].items = [];

    this.autofill.inputs[field] = "";
    this.autofill.data[field] = data;
    this.autofill.selected[field] = [];

    for(var i = 0; i < length; i++) {
      if(data[i] != null) {
        this.facets[field].items[data[i]] = {
          label: data[i],
          value: this.toRDFLiteral(data[i]) + " .",
          checked: false
        };
      }
    }
  }

  canAddFilters(key) {
    return this.autofill.data[key].length > this.maxEntries;
  }

  // Get all active facets of a certain field
  getActiveFilters(field) {
    var activeFilters = [];

    for(var f in this.facets[field].items) {
      var filter = this.facets[field].items[f];
      if(filter.checked) {
        activeFilters.push(filter);
      }
    }

    return activeFilters;
  }

  // Checks whether any filter for a field is set
  hasActiveFilters(field) {
    for(var f in this.facets[field].items) {
      var filter = this.facets[field].items[f];
      if(filter.checked) {
        return true;
      }
    }

    return false;
  }

  // Adds a filter for a field
  addFilter(field, value, checked) {

    for(var i = 0; i < this.facets[field].items.length; i++) {
      if(this.facets[field].items[i].label == value) {
        this.facets[field].items[i].checked = checked;
        return;
      }
    }

    this.facets[field].items.push({
      label: value,
      value: this.toRDFLiteral(value) + " .",
      checked: checked
    });
  }



  applyFilters(queryBuilder) {
    queryBuilder.clear();

    for(var f in this.facets) {
      for(var i in this.facets[f].items) {
        var filter = this.facets[f].items[i];
        if(filter.checked) {
          queryBuilder[f].values.push(filter.value);
        }
      }
    }

    queryBuilder.updateQuery();
  }

  complete(key){
    this.autofill.selected[key].length = 0;
		for(var a in this.autofill.data[key]) {
      var e = this.autofill.data[key][a];
			if(e.toLowerCase().indexOf(this.autofill.inputs[key].toLowerCase())>=0){
				this.autofill.selected[key].push(e);
			}
		}
	}

  querySparql(query, callback) {

    this.lastRequestRevision++;
    this.isLoading = true;
    this.totalSize = 0;
    this.numFiles = 0;

    var self = this;
    var url = "https://databus.dbpedia.org/repo/sparql";
    var queryUrl = url + "?query=" + encodeURIComponent(query);
    var requestRevision = this.lastRequestRevision;

    $.ajax({
       url: queryUrl,
       data: {
           format: 'json'
       },
       error: function() {
         alert("error");
       },
       dataType: 'jsonp',
       success: function(data) {

          if(requestRevision == self.lastRequestRevision) {
           self.queryResult.bindings = data.results.bindings;

           self.queryResult.uriList = "";

           for(var b in self.queryResult.bindings) {
             var binding = self.queryResult.bindings[b];
             binding.size.numericalValue = parseInt(binding.size.value);
             self.queryResult.uriList += binding.file.value + "\n";

             self.totalSize += binding.size.numericalValue;
             self.numFiles++;

           }

           self.isLoading = false;
           callback();
         }
       },
       type: 'GET'
    });
  }
}


// hinzufügen eines Controllers zum Modul
function ArtifactFacetsController($http) {

  var ctrl = this;

  ctrl.$http = $http;
  ctrl.activeTab = 0;

  ctrl.displayBaseQuery =
    "PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n" +
    "PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n" +
    "PREFIX dct: <http://purl.org/dc/terms/>\n" +
    "PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\n" +
    "# Get all files\n" +
    "SELECT DISTINCT ?file WHERE {\n " +
    "\t?dataset dataid:artifact <%ARTIFACT_URI%> .\n" +
    "\t?dataset dcat:distribution ?distribution ." +
    "%OPTIONS%\n\t?distribution dcat:downloadURL ?file .\n}";

  ctrl.fullBaseQuery =
  "PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n" +
  "PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n" +
  "PREFIX dct: <http://purl.org/dc/terms/>\n" +
  "PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\n" +
  "# Get all files\n" +
  "SELECT DISTINCT ?file ?version ?variant ?format ?compression ?size ?preview WHERE {\n " +
  "\t?dataset dataid:artifact <%ARTIFACT_URI%> .\n" +
  "\t?dataset dcat:distribution ?distribution ." +
  "\t?distribution dct:hasVersion ?version ." +
  "\t?distribution dataid:formatExtension ?format ." +
  "\tOPTIONAL { ?distribution dataid:contentVariant ?variant . }" +
  "\t?distribution dataid:compression ?compression ." +
  "\t?distribution dcat:byteSize ?size ." +
  "\t?distribution dataid:preview ?preview ." +
  "%OPTIONS%\n\t?distribution dcat:downloadURL ?file .\n}";


  ctrl.$onInit = function() {

    // create the queries...
    ctrl.displayBaseQuery = ctrl.displayBaseQuery.replace("%ARTIFACT_URI%", ctrl.data.uri);
    ctrl.fullBaseQuery = ctrl.fullBaseQuery.replace("%ARTIFACT_URI%", ctrl.data.uri);
    ctrl.isLoading = true;

    // load the artifact facets
    ctrl.$http.get('/system/api/facets', { params : { uri : ctrl.data.uri } }).then(function(result) {

      ctrl.isLoading = false;

      if(ctrl.data.settings == undefined) {
        ctrl.data.settings = [];
        ctrl.data.settings.push({
          field : "http://www.w3.org/ns/dcat#version",
          value : 'Latest Version',
          checked : true
        });
      }

      result.data["http://www.w3.org/ns/dcat#version"].values.push({
        label : 'Latest Version',
        value : ArtifactFacetSettings.FACET_ARTIFACT_LATEST_VERSION
      });

      ctrl.facetsCtrl = new ArtifactFacetViewController(result.data, new ArtifactFacetSettings(ctrl.data.settings));

      ctrl.displayQueryBuilder = new QueryBuilder(ctrl.displayBaseQuery, '%OPTIONS%', ctrl.data.uri);

      ctrl.queryBuilder = new QueryBuilder(ctrl.fullBaseQuery, '%OPTIONS%', ctrl.data.uri);
      ctrl.queryBuilder.onQueryUpdated = function(query) {
        ctrl.querySparql(query);
      };
    });
  }

  ctrl.formatUploadSize = function(size) {
    return Math.round(size * 100) / 100;
  };

  ctrl.hideAutofill = function() {
    ctrl.fileSelector.clearAutofill(function() {
      ctrl.$apply();
    });
  }

/*


      ctrl.facetsCtrl.facets["http://www.w3.org/ns/dcat#version"].items.unshift({
        label: "Latest Version",
        value: "?latestVersion \n\t{\n\t\tSELECT (?version as ?latestVersion) WHERE {\n\t\t\t?dataset dataid:artifact <" +
          ctrl.data.uri
          + "> .\n\t\t\t?dataset dct:hasVersion ?version . \n\t\t} ORDER BY DESC (?version) LIMIT 1 \n\t}",
        checked: false
      });


ctrl.facets.createFilterCategory('Versions', ctrl.data.dropDownData, 'versions');
ctrl.facets.createFilterCategory('Content Variants', ctrl.data.dropDownData, 'variants');
ctrl.facets.createFilterCategory('File Formats', ctrl.data.dropDownData, 'formats');
ctrl.facets.createFilterCategory('Compression Types', ctrl.data.dropDownData, 'compressions');

ctrl.facets.filters.variants.items.unshift({
  label: "None",
  value: "FILTER NOT EXISTS { ?distribution dataid:contentVariant ?o }",
  checked: false
});

ctrl.facets.filters.versions.items.unshift({
  label: "Latest Version",
  value: "?latestVersion \n\t{\n\t\tSELECT (?version as ?latestVersion) WHERE {\n\t\t\t?dataset dataid:artifact <" +
    ctrl.artifactData.uri
    + "> .\n\t\t\t?dataset dct:hasVersion ?version . \n\t\t} ORDER BY DESC (?version) LIMIT 1 \n\t}",
  checked: true
});

  ctrl.formatUploadSize = function(size) {
    return Math.round(size * 100) / 100;
  };

  ctrl.hideAutofill = function() {
    ctrl.fileSelector.clearAutofill(function() {
      ctrl.$apply();
    });
  }

  ctrl.showCollectionModal = function() {
    $( '#add-to-collection-modal' ).addClass('is-active');
  }

  ctrl.hideCollectionModal = function() {
    $( '#add-to-collection-modal' ).removeClass('is-active');
  }

  // Collection manager for collection access
  ctrl.collectionManager = new DatabusCollectionManager($http, "databus_collections")

  ctrl.addQueryToCollection = function() {
    ctrl.collectionManager.addElement(ctrl.queryBuilder.query);
    ctrl.hideCollectionModal();
  };

  ctrl.formatDate = function(date) {
    return moment(date).format('MMM Do YYYY');
  };

  // Yasqe manager to access yasqe text fields


  var baseQuery =
    "PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n" +
    "PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n" +
    "PREFIX dct: <http://purl.org/dc/terms/>\n" +
    "PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\n" +
    "# Get all files\n" +
    "SELECT DISTINCT ?file WHERE {\n " +
    "\t?dataset dataid:artifact <" + ctrl.artifactData.uri + "> .\n" +
    "\t?dataset dcat:distribution ?distribution ." +
    "%OPTIONS%\n\t?distribution dcat:downloadURL ?file .\n}";

  ctrl.queryBuilder = new QueryBuilder(baseQuery, '%OPTIONS%', ctrl.artifactData.uri);
  ctrl.queryBuilder.onQueryUpdated = function(query) {
    var yasqeText = ctrl.yasqe.getText("textAreaItem");
    if(yasqeText != undefined) {
      yasqeText.setValue(query);
    }
  };

  var fullQuery =
    "PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>\n" +
    "PREFIX dataid-cv: <http://dataid.dbpedia.org/ns/cv#>\n" +
    "PREFIX dct: <http://purl.org/dc/terms/>\n" +
    "PREFIX dcat:  <http://www.w3.org/ns/dcat#>\n\n" +
    "# Get all files\n" +
    "SELECT DISTINCT ?file ?version ?variant ?format ?compression ?size ?preview WHERE {\n " +
    "\t?dataset dataid:artifact <" + ctrl.artifactData.uri + "> .\n" +
    "\t?dataset dcat:distribution ?distribution ." +
    "\t?distribution dct:hasVersion ?version ." +
    "\t?distribution dataid:formatExtension ?format ." +
    "\tOPTIONAL { ?distribution dataid:contentVariant ?variant . }" +
    "\t?distribution dataid:compression ?compression ." +
    "\t?distribution dcat:byteSize ?size ." +
    "\t?distribution dataid:preview ?preview ." +
    "%OPTIONS%\n\t?distribution dcat:downloadURL ?file .\n}";

  ctrl.fullBuilder = new QueryBuilder(fullQuery, '%OPTIONS%', ctrl.artifactData.uri);
  ctrl.fullBuilder.onQueryUpdated = function(query) {
    ctrl.querySparql(query);
  };

  ctrl.addFilter = function(selected, key) {
    ctrl.fileSelector.addFilter(selected, key);
    ctrl.updateQueryBuilder();
  }

  ctrl.querySparql = function(query, callback) {

    ctrl.fileSelector.querySparql(query, function() {
      ctrl.$apply();
    });
  }

  ctrl.onQueryResult = function(bindings) {
    ctrl.queryResult.bindings = bindings;
  }

  ctrl.updateQueryBuilder = function() {
    ctrl.fileSelector.applyFilters(ctrl.queryBuilder);
    ctrl.fileSelector.applyFilters(ctrl.fullBuilder);
  }

  /**
   * Rapid prototyping method to add to first collection
   * @param  {[type]} query [description]
   * @return {[type]}       [description]

  ctrl.addQueryToCurrentCollection = function(query) {
    ctrl.collectionManager.addElement(query);
    ctrl.alertSuccess("Query added to collection", 1000);
  };

  ctrl.fileSelector.applyFilters(ctrl.queryBuilder);
  ctrl.fileSelector.applyFilters(ctrl.fullBuilder);

  $( "body" ).click(function() {
    $( ".dropdown" ).removeClass("is-active");
  });
     */
}

databusApplication.component('artifactFacets', {
  templateUrl: '/templates/artifact-facets.html',
  controller: [ '$http', ArtifactFacetsController ],
  bindings: {
    data: '='
  }
});
