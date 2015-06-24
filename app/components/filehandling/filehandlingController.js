'use strict';

angular.module('acjim.filehandling', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/filehandling', {
            templateUrl: 'app/components/filehandling/filehandlingView.html',
            controller: 'filehandlingCtrl'
        });
    }])

    .controller('filehandlingCtrl', ['$scope', '$http', 'mapService', 'fileDialog', function($scope, $httd, mapService, fileDialog) {
        $scope.open = function() {
            fileDialog.openFile(function(filename) {
                // your code
            }, false, 'text/html');
        };
    }])