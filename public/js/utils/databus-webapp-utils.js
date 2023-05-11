class DatabusWebappUtils {

  constructor($scope) {
    this.scope = $scope;
  }

  createAccount() {
    window.location = '/app/account';
  }

  login() {
    window.location = '/app/login?redirectUrl=' + encodeURIComponent(window.location);
  }

  logout() {
    window.location = '/app/logout?redirectUrl=' + encodeURIComponent(window.location);
  }

  formatDateFromNow(date) {
    return moment(date).fromNow();
  }

  formatDate(date) {
    return moment(date).format('MMM Do YYYY') + " (" + moment(date).fromNow() + ")";
  }

  formatLongDate(longString) {
    var number = new Number(longString);
    var dateTime = new Date(number);
    return this.formatDate(dateTime);
  }

  formatFileSize (size) {
    return DatabusUtils.formatFileSize(size);
  }

  uriToName(uri) {
    return DatabusUtils.uriToName(uri); 
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