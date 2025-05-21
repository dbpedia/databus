const AccountPageController = require("./page-controller/account-controller");
const ArtifactPageController = require("./page-controller/artifact-controller");
const FrontPageController = require("./page-controller/frontpage-controller");
const HeaderController = require("./page-controller/header-controller");
const CollectionController = require("./page-controller/collection-controller");
const CollectionsEditorController = require("./page-controller/collections-editor-controller");
const GroupPageController = require("./page-controller/group-controller");
const ProfileController = require("./page-controller/profile-controller");
const PublishWizardController = require("./page-controller/publish-wizard-controller");
const VersionPageController = require("./page-controller/version-controller");
const UserSettingsController = require("./page-controller/user-settings-controller");
const DatabusCollectionManager = require("./collections/databus-collection-manager");
const SearchManager = require("./search/search-manager");
const SearchController = require("./components/search/search-controller");
const DatabusAlertController = require("./components/databus-alert/databus-alert-controller");
const EntityCardController = require("./components/entity-card/entity-card");
const OverrideCheckboxController = require("./components/override-checkbox/override-checkbox");
const AutofillDropdownController = require("./components/autofill-dropdown/autofill-dropdown");
const DatabusIconController = require("./components/databus-icon/databus-icon");
const TypeTagController = require("./components/type-tag/type-tag");
const CollectionEditorWidgetController = require("./components/collection-editor-widget/collection-editor-widget");
const CollectionHierarchyControllerTwo = require("./components/collection-hierarchy-two/collection-hierarchy");
const UriBreadcrumbsController = require("./components/uri-breadcrumbs/uri-breadcrumbs");
const TableEditorController = require("./components/table-editor/table-editor");
const MultiselectDropdownController = require("./components/multiselect-dropdown/multiselect-dropdown");
const FileBrowserController = require("./components/file-browser/file-browser");
const FacetsViewController = require("./components/facets-view/facets-view");
const ExpandableArrowController = require("./components/expandable-arrow/expandable-arrow");
const YasqeTextController = require("./components/yasqe-text/yasqe-text");
const YasrViewController = require("./components/yasr-view/yasr-view");
const CollectionStatisticsController = require("./components/collection-statistics/collection-statistics");
const CollectionNodeController = require("./components/collection-node/collection-node");
const CollectionSearchController = require("./components/collection-search/collection-search");
const CollectionStatusController = require("./components/collection-status/collection-status");
const CollectionDataTableController = require("./components/collection-data-table/collection-data-table");
const AccountHistoryController = require("./components/account-history/account-history");
const SparqlEditorController = require("./page-controller/sparql-editor-controller");
const BetterDropdownController = require("./components/better-dropdown/better-dropdown");
const NavSearchController = require("./components/nav-search/nav-search-controller");

var databusApplication = angular.module("databusApplication", [])
  .controller("HeaderController", ["$scope", "$http", "collectionManager", HeaderController])
  .factory('collectionManager', [ "$interval", "$http", function ($interval, $http) { return new DatabusCollectionManager($http, $interval, 'databus_collections'); }])
  .factory('searchManager', [ "$interval", "$http", function ($interval, $http) { return new SearchManager($http, $interval); }])
  .factory('focus', ["$timeout", "$window", function ($timeout, $window) {
    return function (id) {
      $timeout(function () {
        var element = $window.document.getElementById(id);
        if (element)
          element.focus();
      });
    };
  }])
  .controller("UserSettingsController", [ "$scope", "$http", "$sce", "$location", UserSettingsController])
  .controller("HeaderController", ["$scope", "$http", "collectionManager", "searchManager", HeaderController])
  .controller("AccountPageController", ["$scope", "$http", "$location", "collectionManager", AccountPageController])
  .controller("FrontPageController", ["$scope", "$sce", "$http", FrontPageController])
  .controller("ArtifactPageController", ["$scope", "$http", "$sce", "$location", "collectionManager", ArtifactPageController])
  .controller("CollectionController", ["$scope", "$sce", "$http", "collectionManager", CollectionController])
  .controller("CollectionsEditorController", ["$scope", "$timeout", "$http", "$location", "collectionManager", CollectionsEditorController])
  .controller("GroupPageController", ["$scope", "$http", "$sce", "$interval", "$location", "collectionManager", GroupPageController])
  .controller("ProfileController", ["$scope", "$http", ProfileController])
  .controller("SparqlEditorController", ["$scope", "$http", SparqlEditorController])
  .controller("PublishWizardController", ["$scope", "$http", "$interval", "focus", "$q", PublishWizardController])
  .controller("VersionPageController", ["$scope", "$http", "$sce", "$location", "collectionManager", VersionPageController])
  .directive('uploadRanking', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/website/templates/upload-ranking.html',
      scope: {
        data: '=data'
      }
    }
  });
 
function config($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
    rewriteLinks: false
  });
};

databusApplication.filter('collectionfilter', function() {
  return function(input, search) {
    if (!input) return input;
    
    var expected = '';

    if (search != null) {
      expected = ('' + search).toLowerCase();
    }

    var result = [];

    angular.forEach(input, function(value, key) {
      if(value.title == undefined) {
        return;
      }
      
      if(value.title.toLowerCase().includes(expected)) {
        result.push(value); 
      }
    });

    return result;
  }
});

databusApplication.config(['$locationProvider', config]);

// Components
databusApplication.component('overrideCheckbox', {
  templateUrl: '/js/components/override-checkbox/override-checkbox.html',
  controller: OverrideCheckboxController,
  bindings: {
    checkValue: '<',
    label: '<',
    id: '<',
    readonly: '<',
    isOverride: '<',
    onChange: '&'
  }
});

databusApplication.component('accountHistory', {
  templateUrl: '/js/components/account-history/account-history.html',
  controller: [ '$http', AccountHistoryController ],
  bindings: {
    accountName: '<'
  }
});

// Components
databusApplication.component('databusAlert', {
  templateUrl: '/js/components/databus-alert/databus-alert.html',
  controller: [ '$scope', '$timeout', DatabusAlertController ],
});

databusApplication.component('entityCard', {
  templateUrl: '/js/components/entity-card/entity-card.html',
  controller: ['$sce', EntityCardController ],
  bindings: {
    label: '<',
    uri: '<',
    desc: '<',
    date: '<',
    type: '<',
    imageUrl: '<',
    absolute: '<'
  }
});

databusApplication.component('search', {
  templateUrl: '/js/components/search/search.html',
  controller: ['$http', '$interval', '$sce', 'searchManager', SearchController],
  bindings: {
    searchInput: '=',
    settings: '<',
  }
});


databusApplication.component('navSearch', {
  templateUrl: '/js/components/nav-search/nav-search.html',
  controller: ['$http', '$interval', '$sce', 'searchManager', NavSearchController],
  bindings: {
    searchInput: '=',
    settings: '<',
  }
});

/*
databusApplication.component('databusSearch', {
  templateUrl: '/js/components/databus-search/databus-search.html',
  controller: ['$http', '$interval', '$sce', DatabusSearchController],
  bindings: {
    filters: '=',
    input: '='
  }
});*/

databusApplication.component('autofillDropdown', {
  templateUrl: '/js/components/autofill-dropdown/autofill-dropdown.html',
  controller: ['$timeout', AutofillDropdownController ],
  bindings: {
    input: '=',
    values: '<',
    isDisabled: '<',
    placeholder: '@',
    onChange: '&'
  }
});


databusApplication.component('databusIcon', {
  templateUrl: '/js/components/databus-icon/databus-icon.html',
  controller: DatabusIconController,
  bindings: {
    size: '<',
    shape: '<',
    onClick: '&',
    isClickable: '<',
    color: '<'
  }
});

databusApplication.component('typeTag', {
  templateUrl: '/js/components/type-tag/type-tag.html',
  controller: TypeTagController,
  bindings: {
    type: '<',
    height: '<',
    width: '<',
  }
});

/*

databusApplication.component('collectionEditor', {
  templateUrl: '/js/components/collection-editor/collection-editor.html',
  controller: ['$http', '$location', '$sce', CollectionEditorController],
  bindings: {
    collection: '=',
    readonly: '<',
    onPublish: '&',
    onDelete: '&',
    loggedIn: '<'
  }
});*/

databusApplication.component('collectionEditorWidget', {
  templateUrl: '/js/components/collection-editor-widget/collection-editor-widget.html',
  controller: ['collectionManager', '$scope', CollectionEditorWidgetController ],
  bindings: {
    selection: '<',
    collection: '=',
  }
});

/*
databusApplication.component('collectionHierarchy', {
  templateUrl: '/js/components/collection-hierarchy/collection-hierarchy.html',
  controller: ['$http', '$location', '$sce', CollectionHierarchyController],
  bindings: {
    collection: '=',
    readonly: '<',
    onPublish: '&',
    onDelete: '&',
    loggedIn: '<',
    onChange: '&'
  }
});*/

databusApplication.component('collectionHierarchyTwo', {
  templateUrl: '/js/components/collection-hierarchy-two/collection-hierarchy.html',
  controller: ['$http', '$location', '$sce', '$scope', 'collectionManager', CollectionHierarchyControllerTwo ],
  bindings: {
    collection: '=',
    onChange: '&',
    onAddContent: '&'
  }
});

databusApplication.component('collectionNode', {
  templateUrl: '/js/components/collection-node/collection-node.html',
  controller: CollectionNodeController,
  bindings: {
    node: '<',
    readonly: '<',
    onRemoveNode: '&',
    onClick: '&',
    count: '<',
    isExpandable: '<'
  }
});

databusApplication.component('collectionSearch', {
  templateUrl: '/js/components/collection-search/collection-search.html',
  controller: ['collectionManager', '$http', '$interval', '$sce', CollectionSearchController ],
  bindings: {
    collection: '=',
    targetDatabusUrl: '<',
    onComponentAdded: '&'
  }
});

databusApplication.component('collectionStatistics', {
  templateUrl: '/js/components/collection-statistics/collection-statistics.html',
  controller: ['$http', '$scope', '$location', '$sce', CollectionStatisticsController ],
  bindings: {
    collection: '<'
  }
});

databusApplication.component('collectionStatus', {
  templateUrl: '/js/components/collection-status/collection-status.html',
  controller: ['$http', '$location', '$sce', CollectionStatusController ],
  bindings: {
    hasLocalChanges: '<',
    isPublished: '<',
    isDraft: '<',
  }
});

/*

databusApplication.component('editLabel', {
  templateUrl: '/js/components/edit-label/edit-label.html',
  controller: ['$element', EditLabelController],
  bindings: {
    text: '=',
    singleLine: '<',
    onBlur: '&',
    onChange: '&'
  }
});*/

databusApplication.component('expandableArrow', {
  templateUrl: '/js/components/expandable-arrow/expandable-arrow.html',
  controller: ExpandableArrowController,
  bindings: {
    expanded: '=',
    onChange: '&',
    isReadonly: '<'
  }
});

databusApplication.component('facetsView', {
  templateUrl: '/js/components/facets-view/facets-view.html',
  controller: ['$http', '$scope', FacetsViewController ],
  bindings: {
    node: '=',
    readonly: '<',
    resourceType: '@',
    onChange: '&',
    onLoaded: '&'
  }
});

databusApplication.component('facetsViewHorizontal', {
  templateUrl: '/js/components/facets-view/facets-view-horizontal.html',
  controller: ['$http', '$scope', FacetsViewController ],
  bindings: {
    node: '=',
    readonly: '<',
    resourceType: '@',
    onChange: '&',
    onLoaded: '&'
  }
});

databusApplication.component('fileBrowser', {
  templateUrl: '/js/components/file-browser/file-browser.html',
  controller: ['$http', '$scope', FileBrowserController ],
  bindings: {
    resourceUri: '<',
    resourceType: '@',
    node: '<',
    facetSettings: '<',
    parentFacetSettings: '<',
    query: '<',
    fullQuery: '<',
    config: '<'
  }
});

/*

databusApplication.component('multiselectArtifactDropdown', {
  templateUrl: '/js/components/multiselect-artifact-dropdown/multiselect-artifact-dropdown.html',
  controller: ['$timeout', '$sce', MultiselectArtifactDropdownController],
  bindings: {
    data: '<',
    node: '<',
    values: '<',
    isDisabled: '<',
    icon: '<',
    onChange: '&'
  }
});*/

databusApplication.component('multiselectDropdown', {
  templateUrl: '/js/components/multiselect-dropdown/multiselect-dropdown.html',
  controller: ['$timeout', '$sce', MultiselectDropdownController],
  bindings: {
    parentInput: '<',
    input: '=',
    values: '<',
    isDisabled: '<',
    placeholder: '@',
    onChange: '&'
  }
});

databusApplication.component('tableEditor', {
  templateUrl: '/js/components/table-editor/table-editor.html',
  controller: TableEditorController,
  bindings: {
    model: '=',
    onRemoveFile: '&',
    onAnalyzeFile: '&',
    analysisProcesses: '<'
  }
});

databusApplication.component('uriBreadcrumbs', {
  templateUrl: '/js/components/uri-breadcrumbs/uri-breadcrumbs.html',
  controller: UriBreadcrumbsController,
  bindings: {
    uri: '<',
    absolute: '<'
  }
});


databusApplication.component('yasqeText', {
  templateUrl: '/js/components/yasqe-text/yasqe-text.html',
  controller: ['$scope', '$element', YasqeTextController ],
  bindings: {
    query: '=',
    autoSize: '<',
    readOnly: '<',
    onChange: '&',
    onSend: '&',
    hasSend: '<'
  }
});

databusApplication.component('betterDropdown', {
  templateUrl: '/js/components/better-dropdown/better-dropdown.html',
  controller: ['$scope', '$interval', '$element', BetterDropdownController ],
  bindings: {
    rootNode: '=',
    onNodeClicked: '&',
    icon: '<',
    label: '<'
  }
});


databusApplication.component('yasrView', {
  templateUrl: '/js/components/yasr-view/yasr-view.html',
  controller: ['$scope', '$element', YasrViewController ],
  bindings: {
    data: '=',
    autoSize: '<',
    readOnly: '<',
    onChange: '&'
  }
});

databusApplication.component('collectionDataTable', {
  templateUrl: '/js/components/collection-data-table/collection-data-table.html',
  controller: ['$http', '$scope', '$location', '$sce', CollectionDataTableController],
  bindings: {
    collection: '<'
  }
});


databusApplication.directive('selectOnClick', ['$window', function ($window) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.on('click', function () {
        if (!$window.getSelection().toString() && this.readonly == false) {
          // Required for mobile Safari
          this.setSelectionRange(0, this.value.length)
        }
      });
    }
  };
}]);

databusApplication.directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function (scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function (value) {
        if (value === true) {
          $timeout(function () {
            element[0].focus();
          });
        }
      });
    }
  };
}]);

databusApplication.directive('eventFocus', function (focus) {
  return function (scope, elem, attr) {
    elem.on(attr.eventFocus, function () {
      focus(attr.eventFocusId);
    });

    // Removes bound events in the element itself
    // when the scope is destroyed
    scope.$on('$destroy', function () {
      elem.off(attr.eventFocus);
    });
  };
});



databusApplication.directive('uploaderRanking', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<div><table class="table is-size-6 is-fullwidth"><thead><tr><th>User</th><th>Uploads</th><th>Derived Data</th></tr></thead><tbody><tr ng-repeat="row in data"><td><a href="{{ row.accountUri }}">{{ row.account }}</a></td><td>{{ row.numUploads }}</td><td>{{ row.uploadSize }}</td></tr></tbody></table></div>',
    scope: {
      data: '=data',
    }
  }
});


databusApplication.directive('groupsTable', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<div><table class="table is-size-6 is-fullwidth"><thead><tr><th>Group Id</th><th># Artifacts</th></tr></thead><tbody><tr ng-repeat="row in data"><td><a href="{{ row.uri }}">{{ row.label }}</a></td><td>{{ row.artifactCount }}</td></tr></tbody></table></div>',
    scope: {
      data: '=data',
    }
  }
});


databusApplication.directive('activityChart', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<svg class="chart"></svg>',
    scope: {
      data: '=data',
      height: '=height'
    },
    link: function (scope, element, attrs) {

      var svgHeight = scope.height;

      for (d in scope.data) {
        scope.data[d].date = new Date(scope.data[d].date);
      }

      var svg = d3.select(element[0])
        .attr("id", "graph")
        .attr("width", "107%")
        .attr("height", svgHeight);

      var bounds = svg.node().getBoundingClientRect();
      var svgWidth = bounds.width;

      var margin = { top: 20, right: 50, bottom: 60, left: 50 };
      var width = svgWidth - margin.left - margin.right;
      var height = svgHeight - margin.top - margin.bottom;

      var g = svg.append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")"
        );

      var x = d3.scaleTime().rangeRound([0, width]);
      var y = d3.scaleLinear().rangeRound([height, 0]);

      var line = d3.line()
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.value) })

      x.domain(d3.extent(scope.data, function (d) { return d.date }));
      y.domain(d3.extent(scope.data, function (d) { return d.value }));

      g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

      g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "1em")
        .attr("font-size", "1.1em")
        .attr("text-anchor", "end")
        .text("Uploaded Data (GByte)");

      var path = g.append("path")
        .datum(scope.data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", line);
    }
  }
});

databusApplication.directive('onFinishRender', ['$timeout', '$parse', function ($timeout, $parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
          if (!!attr.onFinishRender) {
            $parse(attr.onFinishRender)(scope);
          }
        });
      }
    }
  }
}]);

databusApplication.directive('clickOutside', [
  '$document', '$parse', '$timeout',
  clickOutside
]);

/**
     * @ngdoc directive
     * @name angular-click-outside.directive:clickOutside
     * @description Directive to add click outside capabilities to DOM elements
     * @requires $document
     * @requires $parse
     * @requires $timeout
     **/
 function clickOutside($document, $parse, $timeout) {
  return {
      restrict: 'A',
      link: function($scope, elem, attr) {

          // postpone linking to next digest to allow for unique id generation
          $timeout(function() {
              var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.split(/[ ,]+/) : [],
                  fn;

              function eventHandler(e) {
                  var i,
                      element,
                      r,
                      id,
                      classNames,
                      l;

                  // check if our element already hidden and abort if so
                  if (angular.element(elem).hasClass("ng-hide")) {
                      return;
                  }

                  // if there is no click target, no point going on
                  if (!e || !e.target) {
                      return;
                  }

                  // loop through the available elements, looking for classes in the class list that might match and so will eat
                  for (element = e.target; element; element = element.parentNode) {
                      // check if the element is the same element the directive is attached to and exit if so (props @CosticaPuntaru)
                      if (element === elem[0]) {
                          return;
                      }
                      
                      // now we have done the initial checks, start gathering id's and classes
                      id = element.id,
                      classNames = element.className,
                      l = classList.length;

                      // Unwrap SVGAnimatedString classes
                      if (classNames && classNames.baseVal !== undefined) {
                          classNames = classNames.baseVal;
                      }

                      // if there are no class names on the element clicked, skip the check
                      if (classNames || id) {

                          // loop through the elements id's and classnames looking for exceptions
                          for (i = 0; i < l; i++) {
                              //prepare regex for class word matching
                              r = new RegExp('\\b' + classList[i] + '\\b');

                              // check for exact matches on id's or classes, but only if they exist in the first place
                              if ((id !== undefined && id === classList[i]) || (classNames && r.test(classNames))) {
                                  // now let's exit out as it is an element that has been defined as being ignored for clicking outside
                                  return;
                              }
                          }
                      }
                  }

                  // if we have got this far, then we are good to go with processing the command passed in via the click-outside attribute
                  $timeout(function() {
                      fn = $parse(attr['clickOutside']);
                      fn($scope, { event: e });
                  });
              }

              // if the devices has a touchscreen, listen for this event
              if (_hasTouch()) {
                  $document.on('touchstart', eventHandler);
              }

              // still listen for the click event even if there is touch to cater for touchscreen laptops
              $document.on('click', eventHandler);

              // when the scope is destroyed, clean up the documents event handlers as we don't want it hanging around
              $scope.$on('$destroy', function() {
                  if (_hasTouch()) {
                      $document.off('touchstart', eventHandler);
                  }

                  $document.off('click', eventHandler);
              });

              /**
               * @description Private function to attempt to figure out if we are on a touch device
               * @private
               **/
              function _hasTouch() {
                  // works on most browsers, IE10/11 and Surface
                  return 'ontouchstart' in window || navigator.maxTouchPoints;
              };
          });
      }
  };
}
