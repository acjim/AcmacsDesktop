'use strict';

var app = angular.module('acjim.filehandling',[]);

app.controller('filehandlingCtrl', ['$scope', '$http', 'mapService', 'fileDialog', function($scope, $httd, mapService, fileDialog) {

    $scope.fileContent = "test";

    $scope.$on('new-file', function(e, menu, item) {
        console.log( $scope.openMaps, $scope.openMaps.length );
        $scope.openMaps.push( { title:'New Map '+$scope.openMaps.length, content:'Dynamic content '+$scope.openMaps.length, active: true } );
        $scope.$apply();
        console.log( $scope.openMaps );
    });

    $scope.$on('open-file', function(e, menu, item) {
        fileDialog.openFile($scope.handleFileOpen, false, 'text/html');
    });

    $scope.$on('save-file', function(e, menu, item) {
        var filename = 'new.save';

        $scope.openMaps.forEach(function(map, index){
            if(map.active) filename = map.title;
        });
        fileDialog.saveAs($scope.handleFileSave, filename, 'text/html');
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
            }
        });
    };

    $scope.open = function() {
        fileDialog.openFile($scope.handleFileOpen, false, 'text/html');
    };

    $scope.handleFileOpen = function(filename) {
        var fs = require('fs')
        fs.readFile(filename, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }

            $scope.openMaps.push({title:filename, content:data, active: true});

            $scope.fileContent = data;
            $scope.$apply();

        });
    };

    $scope.handleFileSave = function(filename) {
        var fs = require('fs');
        fs.writeFile(filename, $scope.fileContent, function (err) {
            if (err) return console.log(err);
        });
    };
}]);
