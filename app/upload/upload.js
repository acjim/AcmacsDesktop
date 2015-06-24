'use strict';

angular.module('acjim.upload', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/upload', {
            templateUrl: 'upload/upload.html',
            controller: 'uploadCtrl'
        });
    }])

    .controller('uploadCtrl', ['$scope', '$http', 'mapService', function($scope, $httd, mapService) {

    }])