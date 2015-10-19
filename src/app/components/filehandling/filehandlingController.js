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

var app = angular.module('acjim.filehandling',['flash']);
var config = require('./config.js');

app.controller('filehandlingCtrl', ['$rootScope', '$scope', '$q', 'fileDialog', 'api', 'Flash', 'winHandler', 'cfpLoadingBar', function($rootScope, $scope, $q, fileDialog, api, Flash, winHandler, cfpLoadingBar) {
    $scope.fileContent = "";

    $scope.showTable = true;

    $scope.$on('new-file', function(e, menu, item) {

        winHandler.addEmptyWindow();
        $scope.$apply();
    });

    $scope.$on('open-file', function(e, menu, item) {
        fileDialog.openFile($scope.handleFileOpen, false, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    });

    $scope.$on('save-file', function(e, menu, item) {
        var filename = 'new.save';

        $scope.openMaps.forEach(function(map, index){
            if(map.active) {
                filename = map.title;
            }
        });
        fileDialog.saveAs($scope.handleFileSave, filename, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    });

    $scope.$on('close-file', function(e, menu, item) {
        $scope.openMaps.forEach(function(map, index){
           if(map.active) {
               $scope.openMaps.splice(index, 1);
           }
        });
        $scope.$apply();
    });

    $scope.openMaps = [];

    $scope.open = function() {
        fileDialog.openFile($scope.handleFileOpen, false, '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz');
    };

    $scope.handleFileOpen = function(filename) {
        cfpLoadingBar.start();
        if(!fs.existsSync(config.api.path)) //todo: remove the false
        {
            api.asyncTest().then(function(response) {
                var output = api.stubOpen();
                var error_message = 'Core api is missing, please add core api';
                Flash.create('danger', error_message);
                $scope.handleOpenComplete(output);
            });
        } else {
            var additional_params = {};
            var table_additional_params = {}; // check documentation on execute>get_table for additional params
            var map_additional_params = {}; // check documentation on execute>get_map for what params can be passed
            api.import_user_data(filename, additional_params).then(function(output){
                $scope.justAHackVarFor_output_acd1 = output.output_acd1;
                cfpLoadingBar.set(0.3);
                if(process.platform == "win32") { //vagrant can't handle 2 async calls
                    api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1).then(function(output1){
                        cfpLoadingBar.set(0.6)
                        var output_table_json = output1;
                        api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1).then(function(output2){
                            var output_map_json = output2;
                            $scope.handleOpenComplete({
                                output_acd1: output.output_acd1,
                                table_json: output_table_json,
                                map_json: output_map_json
                            });
                        }, function(reason) {
                            return $scope.errorReason(reason);
                        });
                    }, function(reason) {
                        return $scope.errorReason(reason);
                    });
                }else {
                    //under unix, asyncronous is faster
                    $q.all([
                        api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1),
                        api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1)
                    ]).then(function (data) {
                        var output_table_json = data[0];
                        var output_map_json = data[1];

                        $scope.handleOpenComplete({
                            output_acd1: output.output_acd1,
                            table_json: output_table_json,
                            map_json: output_map_json
                        });
                    }, function (reason) {
                        return $scope.errorReason(reason);
                    });
                }
            }, function(reason) {
                return $scope.errorReason(reason);
            });
        }
    };

    $scope.errorReason = function(reason) {
        cfpLoadingBar.complete();
        // TODO: set flash message based on environment
        var error_message = 'Unable to open the file, file import failed!';
        Flash.create('danger', error_message+"<br>\n"+reason);
        return $q.reject(reason);
    };

    $scope.readFile = function(filename) {
        var deferred = $q.defer();
        fs.readFile(filename, 'utf8', function (err,data) {
            deferred.resolve(data);
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
            var tableJsonData = JSON.parse(data[0]);
            var mapJsonData = JSON.parse(data[1]);

            winHandler.addWindow({
                map: mapJsonData,
                table: tableJsonData,
                acd1: output_acd1
            });
        });
        cfpLoadingBar.complete();
    };


    // Watch opened windows
    $scope.$watch(winHandler.getOpenWindows(), function () {
        $scope.openMaps = winHandler.getOpenWindows();
    });


    if (config.devMode) {
        $scope.handleFileOpen("../test/data/test.save");
    }

    $scope.handleFileSave = function(filename) {
        var fs = require('fs');
        fs.writeFile(filename, $scope.fileContent, function (err) {
            if (err) return console.log(err);
        });
    };
}]);