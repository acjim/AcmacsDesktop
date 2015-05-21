'use strict';

// Declare app level module which depends on views, and components
angular.module('acjim', [
    'ngRoute',
    'acjim.map',
    'acjim.comm',
    'ui.bootstrap'
]).

config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/map'});
}]);
