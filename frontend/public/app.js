'use strict';

// Declare app level module which depends on views, and components
angular.module('acjim', [
    'ngRoute',
    'acjim.map',
    'acjim.upload',
    'acjim.table',
    'acjim.comm',
    'ui.bootstrap'
]).

config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/'});
}])

.filter('nl2br', function(){
    return function(text) {
        return text ? text.replace(/\n/g, '<br/>') : '';
    };
})


.factory('mapService', function($rootScope) {
    var sharedService = {};

    sharedService.message = '';

    sharedService.prepForBroadcast = function(msg) {
        this.message = msg;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function() {
        $rootScope.$broadcast('handleBroadcast');
    };

    return sharedService;
});