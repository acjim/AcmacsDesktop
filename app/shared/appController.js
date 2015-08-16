'use strict';

var app = angular.module('acjim.app',[]);

app.controller('appCtrl', ['$scope', 'nwService', function($scope, nwService) {
    $scope.$on('open-debug', function(e, menu, item) {
        nwService.gui.Window.get().showDevTools();
    });

    $scope.$on('reload-app', function(e, menu, item) {
        if (location)
            location.reload();
    });
}]);
