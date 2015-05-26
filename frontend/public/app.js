'use strict';

// Declare app level module which depends on views, and components
angular.module('acjim', [
    'ngRoute',
    'acjim.map',
    'acjim.comm',
    'ngStomp',
    'ui.bootstrap'
]).

config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/map'});
}])

.filter('nl2br', function(){
    return function(text) {
        return text ? text.replace(/\n/g, '<br/>') : '';
    };
});