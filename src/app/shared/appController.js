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

(function() {
    'use strict';

angular.module('acjim')
    .controller('appCtrl', ['$scope', 'nwService', 'fileHandling', 'fileDialog', 'cfpLoadingBar', '$timeout', '$document', 'dialogs', appCtrl]);

    function appCtrl ($scope, nwService, fileHandling, fileDialog, cfpLoadingBar, $timeout, $document, dialogs) {


        /******************** File Handling *******************/

        $scope.$on('open-file', function (event, filename) {
            if (_.isEmpty(filename)) {
                fileDialog.openFile(
                    handleFileOpen,
                    false,
                    '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz'
                );
            } else {
                handleFileOpen(filename);
            }
        });

        $scope.$on('save-as', function (event, filename) {
            if (_.isEmpty(filename)) {
                fileDialog.saveAs(
                    handleFileSaveAs,
                    'NewChart.save',
                    "'.acd1','.lispmds','save'"
                );
            } else {
                handleFileSaveAs(filename);
            }
        });

        $scope.$on('save-file', function () {
            fileHandling.handleFileSaveAs(fileHandling.getOriginalFileName(), null, null, $scope.mapData);
        });

        function handleFileSaveAs(filename) {
            fileHandling.handleFileSaveAs(filename, null, null, $scope.mapData);
        }

        function handleFileOpen(filename) {
            if (!_.isEmpty($scope.tableData)) {
                //open file in new window
                nwService.parentWindow.emit("openFileInNewWindow", filename);
                return;
            }

            fileHandling.handleFileOpen(filename).then(function(result) {
                $scope.tableData = result.table;
                $scope.mapData = result.map;
                $document[0].title += " - " + filename;
            });
        }

        /**
         * Handle file opening on application startup
         */
        var Url = {
            get get(){
                var vars= {};
                if(window.location.search.length!==0) {
                    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                        key = decodeURIComponent(key);
                        if (typeof vars[key] === "undefined") {
                            vars[key] = decodeURIComponent(value);
                        } else {
                            vars[key] = [].concat(vars[key], decodeURIComponent(value));
                        }
                    });
                }
                return vars;
            }
        };

        if(!_.isUndefined(Url.get.filename) && Url.get.filename !== "undefined") {
            handleFileOpen(Url.get.filename);
        }

        /******************** Window management *******************/

        // Open Debug Window
        $scope.$on('open-debug', function () {
            nwService.gui.Window.get().showDevTools();
        });

        // Reload
        $scope.$on('reload-app', function () {
            nwService.window.removeAllListeners();
            nwService.window.reload();
        });

        // Close window
        $scope.$on('close-window', function () {
            nwService.gui.Window.get().close();
        });

        // Close app
        $scope.$on('exit-app', function () {
            nwService.gui.App.quit();
        });

        nwService.window.on('close', function (event) {
            if (fileHandling.getMapIsChanged()) {
                var dlg = dialogs.create('app/components/dialogs/saveDialog.html', 'customDialogCtrl', {}, {backdrop: false, size: 'sm'});

                dlg.result.then(function(result){
                    if (result === 'yes') {
                        // If file should be saved
                        fileHandling.handleFileSaveAs(fileHandling.getOriginalFileName(), this, event, $scope.mapData).then(function (output) {
                            closeWindow(output.triggered_event);
                        }, function (reason) {
                            console.log(reason);
                        });
                    } else {
                        //Don't save file
                        closeWindow(event);
                    }
                }, function(result){
                    //Don't close window, do nothing
                });
            } else {
                closeWindow(event);
            }
        });

        function closeWindow(event_triggered) {
            // Pretend to be closed already
            nwService.window.hide();
            if (event_triggered !== "quit") {
                nwService.parentWindow.emit("window-close", nwService.window.id);
                return;
            }
            nwService.window.close(true);
        }


        /******************** Layout *******************/

        $scope.layout = {
            toolbar: false,
            table: true
        };

        $scope.cloak = true;

        $scope.$on('map.loaded', function () {

            $scope.cloak = false;
            cfpLoadingBar.complete();
        });

        $scope.$on('layout.table', function () {
            $timeout(function() {
                $scope.layout.table = !$scope.layout.table;
            });
        });

        $scope.$on('layout.toolbar', function () {
            $timeout(function() {
                $scope.layout.toolbar = !$scope.layout.toolbar;
            });
        });


    }
})();