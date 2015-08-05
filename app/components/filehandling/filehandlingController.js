'use strict';

var app = angular.module('acjim.filehandling',[]);

app.controller('filehandlingCtrl', ['$scope', 'mapService', 'fileDialog', function($scope, mapService, fileDialog) {

    $scope.fileContent = "test";

    $scope.$on('new-file', function(e, menu, item) {
        $scope.openMaps.push( { title:'New Map '+$scope.openMaps.length, content:'Dynamic content '+$scope.openMaps.length, active: true } );
        $scope.$apply();
    });

    $scope.$on('open-file', function(e, menu, item) {
        fileDialog.openFile($scope.handleFileOpen, false, '.acd1,.json');
    });

    $scope.$on('save-file', function(e, menu, item) {
        var filename = 'new.save';

        $scope.openMaps.forEach(function(map, index){
            if(map.active) filename = map.title;
        });
        fileDialog.saveAs($scope.handleFileSave, filename, '.acd1,.json');
    });

    $scope.$on('close-file', function(e, menu, item) {
        $scope.openMaps.forEach(function(map, index){
           if(map.active) $scope.openMaps.splice(index, 1);
        });
        $scope.$apply();
    });

    $scope.openMaps = [
        // Sample: { title:'Dynamic Title 1', content:'Dynamic content 1' }
    ];

    $scope.selectMap = function(e) {
        $scope.openMaps.forEach(function(map, index){
            if(map.active) {
                $scope.fileContent = map.content;
                mapService.prepForBroadcast($scope.fileContent);
            }
        });
    };

    $scope.open = function() {
        fileDialog.openFile($scope.handleFileOpen, false, '.acd1,.json');
    };

    $scope.handleFileOpen = function(filename) {
        var fs = require('fs')
        fs.readFile(filename, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            var mapJsonData = data.replace(/\'/g, '"').replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false')
                .replace(/[0-9]{1,5}:/g, function(match){return '"' + match.replace(':','') + '":';}); //For the bad formated acd1 files...
            $scope.openMaps.push({title:filename, content: JSON.parse(mapJsonData), active: true});

            $scope.fileContent = data;
            $scope.$apply();
            $scope.selectMap();

        });
    };

    $scope.handleFileSave = function(filename) {
        var fs = require('fs');
        fs.writeFile(filename, $scope.fileContent, function (err) {
            if (err) return console.log(err);
        });
    };
}])
.directive('acTable', function() {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: './app/components/table/tableView.html'
    };
})
.directive('acMap', function() {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: './app/components/map/mapView.html'
    };
});