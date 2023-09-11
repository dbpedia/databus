
class TabNavigation {

  constructor($scope, $location, tabKeys) {
    this.location = $location;
    this.tabKeys = tabKeys;
    this.activeTab = 0;

    var self = this;
    // Watch the location hash and tell the tabnavigation that it changed
    $scope.$watch(function () {
      return $location.hash();
    }, function (newVal, oldVal) {
      self.onLocationHashChanged(newVal, oldVal)
    }, false);
  }


  onLocationHashChanged(value, oldVal) {
    for (var i in this.tabKeys) {
      var tabKey = this.tabKeys[i];
      if (value == tabKey) {
        this.activeTab = i;
        return;
      }
    }
  }

  /**
   * Change the tab - set location hash and scroll up
   * @param {*} value 
   */
  navigateTo(value, scrollToTop) {
    this.location.hash(value);

    if(scrollToTop == true) {
      window.scrollTo(0, 0);
    }
  }

}

module.exports = TabNavigation;