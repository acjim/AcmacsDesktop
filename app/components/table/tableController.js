'use strict';

var app = angular.module('acjim.table',[]);

app.controller('tableCtrl', ['$scope', 'mapService', function($scope, mapService) {

    $scope.tableData = {};

    $scope.$on('handleBroadcast', function () {
        console.log("handleBroadcast in Table", mapService.message);
        $scope.tableData = mapService.message;
        $scope.$apply();
    });
}]);