module.exports = function($scope, $httd, mapService, fileDialog) {

    $scope.file = "test";

    $scope.open = function() {
        fileDialog.openFile($scope.handleFileOpen, false, 'text/html');
    };

    $scope.handleFileOpen = function(filename) {
        fs = require('fs')
        fs.readFile(filename, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            $scope.file = data;
            $scope.$apply(); //don't know why
        });
    };
};
