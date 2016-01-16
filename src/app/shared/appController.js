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
    .controller('appCtrl', ['$scope', 'nwService', 'fileHandling', 'fileDialog', 'cfpLoadingBar', '$window',appCtrl]);

    function appCtrl ($scope, nwService, fileHandling, fileDialog, cfpLoadingBar, $window) {


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

        $scope.$on('save-as', function () {
            fileDialog.saveAs(
                handleFileSaveAs,
                'NewChart.save',
                "'.acd1','.lispmds','save'"
            );
        });

        $scope.$on('save-file', function () {
            fileHandling.handleFileSaveAs(fileHandling.getOriginalFileName());
        });

        function handleFileSaveAs(filename) {
            fileHandling.handleFileSaveAs(filename);
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
            // Pretend to be closed already
            if (fileHandling.getMapIsChanged()) {
                var answer = $window.confirm("Map has been modified, do you want to save before exit?")
                //todo: use proper confirmation dialog
                if (answer) {
                    cfpLoadingBar.start();
                    fileHandling.handleFileSaveAs(fileHandling.getOriginalFileName(), this, event).then(function (output) {
                        fileHandling.setMapIsChanged(false);
                        setTimeout(function() {closeWindow(output.current_window, output.triggered_event)}, 1500);
                    }, function (reason) {
                        return errorReason(reason);
                    });
                } else {
                    closeWindow(this, event);
                }
            } else {
                closeWindow(this, event);
            }
        });

        function closeWindow(current_window, event_triggered) {
            current_window.hide();
            if (event_triggered !== "quit") {
                nwService.parentWindow.emit("window-close", nwService.window.id);
                return;
            }
            current_window.close(true);
        }


        /******************** Layout *******************/

        $scope.layout = {
            toolbar: false,
            table: false
        };
        $scope.cloak = true;

        $scope.$on('map.loaded', function () {
            $scope.cloak = false;
            cfpLoadingBar.complete();
        });

        $scope.$on('layout.table', function () {
            $scope.layout.table = !$scope.layout.table;
            $scope.$apply();
        });

        $scope.$on('layout.toolbar', function () {
            $scope.layout.toolbar = !$scope.layout.toolbar;
            $scope.$apply();
        });


    }
})();