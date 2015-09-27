/*
	Antigenic Cartography for Desktop
	[Antigenic Cartography](http://www.antigenic-cartography.org/) is the process of creating maps of antigenically variable pathogens. 
	In some cases two-dimensional maps can be produced which reveal interesting information about the antigenic evolution of a pathogen.
	This project aims at providing a desktop application for working with antigenic maps.

	© 2015 The Antigenic Cartography Group at the University of Cambridge

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

var app = angular.module('acjim.filehandling',[]);
var config = require('./config.js');

app.controller('filehandlingCtrl', ['$scope', '$q', 'fileDialog', 'api', function($scope, $q, fileDialog, api) {
    $scope.fileContent = "";

    $scope.showTable = true;

    $scope.$on('new-file', function(e, menu, item) {
        $scope.openMaps.push( { title:'New Map '+$scope.openMaps.length, content:'Dynamic content '+$scope.openMaps.length, active: true } );
        $scope.$apply();
    });

    $scope.$on('open-file', function(e, menu, item) {
        fileDialog.openFile($scope.handleFileOpen, false, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    });

    $scope.$on('save-file', function(e, menu, item) {
        var filename = 'new.save';

        $scope.openMaps.forEach(function(map, index){
            if(map.active) filename = map.title;
        });
        fileDialog.saveAs($scope.handleFileSave, filename, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    });

    $scope.$on('close-file', function(e, menu, item) {
        $scope.openMaps.forEach(function(map, index){
           if(map.active) $scope.openMaps.splice(index, 1);
        });
        $scope.$apply();
    });

    $scope.openMaps = [];

    $scope.open = function() {
        fileDialog.openFile($scope.handleFileOpen, false, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    };

    $scope.handleFileOpen = function(filename) {
        if(!fs.existsSync(config.api.path))
        {
            api.asyncTest().then(function(response) {
                var output = api.stub();
                $scope.handleOpenComplete(output);
            });
        } else {
            var additional_params = {};
            var table_additional_params = {}; // check documentation on get_table_data for additional params
            var map_additional_params = {}; // check documentation on get_map for what params can be passed
            var output = api.import_user_data(filename, additional_params).then(function(output){
                $q.all([
                    api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1),
                    api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1)
                ]).then(function(data) {
                    var output_table_json = data[0];
                    var output_map_json = data[1];

                    $scope.handleOpenComplete({
                        output_acd1: output.output_acd1,
                        table_json: output_table_json,
                        map_json: output_map_json
                    });
                }, function(reason) {
                    // error: handle the error if possible and
                    //        resolve promiseB with newPromiseOrValue,
                    //        otherwise forward the rejection to promiseB
                    /*if (canHandle(reason)) {
                        // handle the error and recover
                        return newPromiseOrValue;
                    }*/
                    return $q.reject(reason);
                });
            }, function(reason) {
                // error: handle the error if possible and
                //        resolve promiseB with newPromiseOrValue,
                //        otherwise forward the rejection to promiseB
                /*if (canHandle(reason)) {
                    // handle the error and recover
                    return newPromiseOrValue;
                }*/
                return $q.reject(reason);
            });
        }
    };

    $scope.readFile = function(filename) {
        var deferred = $q.defer();
        fs.readFile(filename, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            data = data.substring(data.indexOf("{")-1);
            var mapJsonData = data.replace(/\'/g, '"').replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false')
                .replace(/[0-9]{1,5}:/g, function(match){return '"' + match.replace(':','') + '":';}); //For the bad formated acd1 files...

            deferred.resolve(mapJsonData);
        });
        return deferred.promise;
    };

    $scope.handleOpenComplete = function(output) {
        var fs = require('fs');
        var output_acd1 = output.output_acd1;
        // parse file returned from table_filename to get json data related with table. NOTE: this file can only be json.
        var table_filename = output.table_json;
        // parse file returned from map_filename to get json data related with maps. NOTE: this file can only be json.
        var map_filename = output.map_json;

        $q.all([
            $scope.readFile(table_filename),
            $scope.readFile(map_filename)
        ]).then(function(data) {
            var tableJsonData = data[0];
            var mapJsonData = data[1];

            var numOpenMaps = $scope.openMaps.length;
            $scope.openMaps[numOpenMaps] = {};
            $scope.openMaps[numOpenMaps].table = JSON.parse(tableJsonData);
            $scope.openMaps[numOpenMaps].map   = JSON.parse(mapJsonData);
            $scope.openMaps[numOpenMaps].title = $scope.openMaps[numOpenMaps].table.info.name;
        });
    };

    $scope.handleFileOpen("./test/data/test.save"); //TODO: Remove me, for developmental purposes

    $scope.handleFileSave = function(filename) {
        var fs = require('fs');
        fs.writeFile(filename, $scope.fileContent, function (err) {
            if (err) return console.log(err);
        });
    };
}]);