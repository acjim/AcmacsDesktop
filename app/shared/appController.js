'use strict';

var app = angular.module('acjim.app',[]);

app.controller('appCtrl', ['$scope', 'nwService', function($scope, nwService) {
    $scope.$on('open-debug', function(e, menu, item) {
        nwService.gui.Window.get().showDevTools();
    });
}]);