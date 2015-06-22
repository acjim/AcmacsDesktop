'use strict';

angular.module('acjim.map', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/map', {
        templateUrl: 'map/map.html',
        controller: 'CanvasCtrl'
    });
}])
