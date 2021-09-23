
// Controller for the header section
function DocumentationController($scope, $sce) {

  $scope.content = data.content;

  angular.element(document).ready(function() {
    var toc = initTOC({
      selector: 'h1, h2, h3, h4, h5, h6',
      scope: '#content',
      overwrite: false,
      prefix: 'toc'
    });

    $('#toc').append(toc);
  });

  $scope.markdownToHtml = function(markdown) {
    var converter = window.markdownit('commonmark');
    return $sce.trustAsHtml(converter.render(markdown));
  };

}
