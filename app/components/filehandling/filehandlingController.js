module.exports = function($scope, $httd, mapService, fileDialog) {
        $scope.open = function() {
            fileDialog.openFile(function(filename) {
                // your code
            }, false, 'text/html');
        };
};
