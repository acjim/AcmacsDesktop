'use strict';

var app = angular.module('acjim.mapService', []);

app.factory('mapService', ['$rootScope', function($rootScope) {
    var sharedService = {};

    sharedService.message = '';

    sharedService.prepForBroadcast = function(msg) {
        this.message = msg;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function() {
        console.log("broadcast");
        $rootScope.$broadcast('handleBroadcast');
    };

    return sharedService;
}]);
