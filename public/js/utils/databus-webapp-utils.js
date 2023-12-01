const DatabusAlert = require("../components/databus-alert/databus-alert");
const DatabusUtils = require("../utils/databus-utils");
const DatabusMessages = require("./databus-messages");

class DatabusWebappUtils {

  constructor($scope, $sce) {
    this.scope = $scope;
    this.sce = $sce;
  }

  createAccount() {
    window.location = '/app/account';
  }

  login() {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  logout() {
    //to actually remove the saved session 
    localStorage.clear();
    //redirect User 
    window.location = '/app/logout?redirectUrl=' + encodeURIComponent(window.location);
  }

  formatDateFromNow(date) {
    return moment(date).fromNow();
  }

  markdownToHtml(markdown) {

    if(this.sce == null) {
      return markdown;
    }

    var markdown = DatabusUtils.renderMarkdown(markdown);

    return this.sce.trustAsHtml(markdown);
  };

  formatDate(date) {
    return DatabusUtils.formatDate(date); // moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
  }

  formatLongDate(longString) {
    var number = new Number(longString);
    var dateTime = new Date(number);
    return this.formatDate(dateTime);
  }

  formatFileSize (size) {
    return DatabusUtils.formatFileSize(size);
  }

  getPathname(uri) {
    var url = new URL(uri);
    return url.pathname;
  }

  objSize(obj) {
    return DatabusUtils.objSize(obj);
  }

  navigateUp(uri) {
    return DatabusUtils.navigateUp(uri);
  }

  uriToName(uri) {
    return DatabusUtils.uriToName(uri); 
  }

  uriToResourceName(uri) {
    return DatabusUtils.uriToResourceName(uri);
  }

  isValidHttpsUrl(url) {
    return DatabusUtils.isValidHttpsUrl(url);
  }

  copyToClipboard(str) {

    if(typeof str === 'object') {
      str = JSON.stringify(str, null, 3);
    }

    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = { position: 'absolute', left: '-9999px' };
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);

    DatabusAlert.alert(this.scope, true, DatabusMessages.GENERIC_COPIED_TO_CLIPBOARD);
  }
}

module.exports = DatabusWebappUtils;
