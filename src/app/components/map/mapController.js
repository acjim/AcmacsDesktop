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
 along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
    'use strict';

    angular.module('acjim.map', [])
        .controller('mapCtrl', [ '$rootScope', '$scope', '$timeout', 'fileHandling', 'toolbar', 'toolbarItems', 'cfpLoadingBar', 'History', mapCtrl ]);

    function mapCtrl($rootScope, $scope, $timeout, fileHandling, toolbar, toolbarItems, cfpLoadingBar, History, mapCtrl) {

        /**
         * Track history event of data
         *
         * @method
         * @params Object
         */

        History.watch('data', $scope);

        /**
         * Watches for a the reoptimize button
         */

        $scope.$on('map.reOptimize', function () {
            fileHandling.reOptimize($scope.data, $scope.pointsMoved).then(function (result) {
                $scope.pointsMoved = false;
                $scope.data = result;
                getErrorConnectionLines();
            });
        });

        /**
         * Calls fileHandlingService for API call to backend to get Error & Connectionlines
         */
        function getErrorConnectionLines() {
            if (!$scope.showConnectionLines) {
                $scope.data.d3ConnectionLines = [];
            }
            if (!$scope.showErrorLines) {
                $scope.data.d3ErrorLines = [];
            }

            if ($scope.showConnectionLines || $scope.showErrorLines) {
                fileHandling.getErrorConnectionLines($scope.data).then(function (result) {
                    $scope.data.d3ConnectionLines = result.d3ConnectionLines;
                    $scope.data.d3ErrorLines = result.d3ErrorLines;
                    if (!$scope.showConnectionLines) {
                        $scope.data.d3ConnectionLines = [];
                    }
                    if (!$scope.showErrorLines) {
                        $scope.data.d3ErrorLines = [];
                    }

                });
            }
        }

        /**
         * Gets new Projection before calling Errorlines from API. This is necessary when nodes where moved, pushes information of new coordinates to backend.
         */
        function getProjectionBeforeErrorLines(avoidErrorLines) {
            fileHandling.getNewProjection($scope.data).then(function (result) {
                $scope.pointsMoved = false;
                $scope.data = result;
                fileHandling.setMapIsChanged(true);
                if(!avoidErrorLines){
                    getErrorConnectionLines();
                }
            });
        }

        /**
         * Watches for a the errorLines button
         */
        $rootScope.$on('map.showErrorLines', function (event, itemID) {
            var item = toolbar.getItemByID(toolbarItems.SHOW_ERROR_LINES);
            if (!itemID) {
                item.active = !item.active;
            }
            $scope.showErrorLines = item.active;
            if ($scope.pointsMoved) {
                getProjectionBeforeErrorLines()
            } else {
                getErrorConnectionLines();
            }
        });

        /**
         * Watches for a the connectionLines button
         */
        $rootScope.$on('map.showConnectionLines', function (event, itemID) {
            var item = toolbar.getItemByID(toolbarItems.SHOW_CONNECTION_LINES);
            if (!itemID) {
                item.active = !item.active;
            }
            $scope.showConnectionLines = item.active;
            if ($scope.pointsMoved) {
                getProjectionBeforeErrorLines();
            } else {
                getErrorConnectionLines();
            }
        });

        /**
         * Listens for nwjs menu item clicks and switches map tools accordingly
         */
        $rootScope.$on('map.selectionTool', function () {
            $timeout(function () {
                var item = toolbar.getItemByID(toolbarItems.SELECTION);
                item.click();
            });
        });
        $rootScope.$on('map.movementTool', function () {
            $timeout(function () {
                var item = toolbar.getItemByID(toolbarItems.MOVEMENT);
                item.click();
            });
        });

        /**
         * Listens for click event on Disconnect Nodes button (DISCONNECT_NODES: Nodes are removed and do not contribute to stress)
         */
        $scope.$on('api.set_disconnected_points', function () {
            fileHandling.disconnectNodes($scope.data, $scope.disconnectSelectedNodes());
        });

        /**
         * Listens for click on Fix Nodes button (FIX_NODES: Nodes continue to contribute to stress)
         */
        $scope.$on('api.set_unmovable_points', function () {
            fileHandling.fixNodes($scope.fixSelectedNodes());
        });

        /**
         * Watches for New Map Create from Selected Nodes
         */
        $scope.$on('map.create_from_selected', function () {
            fileHandling.createNewFileFromAlreadyExistingOne($scope.getSelectedFromCurrentMap());
        });

        /**
         * Watches for moved nodes while lines(error/connection) are displayed
         */
        $scope.$on('map.nudgeTriggeredOnLine', function (avoidErrorLines) {
            getProjectionBeforeErrorLines(avoidErrorLines);
        });

        /**
         * Watches for moved nodes while lines(error/connection) are not displayed
         */
        $scope.$on('map.nudgeTriggered', function () {
            fileHandling.setMapIsChanged(true);
        });

        /**
         * Watches broadcast event fro map.undo
         * Undos the recent change in data
         */
        $scope.$on('map.undo', function() {
            if(History.canUndo('data',$scope) && History.pointers[7].data > 1){
                History.undo('data', $scope);
            }
            $timeout(function() {
                // this function is here just so that scope is applied
            }, 10);
        });

        /**
         * Watches broadcast event fro map.undo
         * Redo the recent change in data
         */
        $scope.$on('map.redo', function() {
            if(History.canRedo('data',$scope)){
                History.redo('data', $scope);
            }
            $timeout(function() {
                // this function is here just so that scope is applied
            }, 10);
        });

        /**
         * Watches broadcast event fro map.undo
         * Redo the recent change in data
         */
        $scope.$on('History.undone', function(event, data) {
            var itemErrorLines, itemConnectionLines;
            itemErrorLines = toolbar.getItemByID(toolbarItems.SHOW_ERROR_LINES);

            itemConnectionLines = toolbar.getItemByID(toolbarItems.SHOW_CONNECTION_LINES);

            if(data.newValue.d3ErrorLines.length > 0) {
                itemErrorLines.active = true;
            }
            else {
                itemErrorLines.active = false;
            }

            if(data.newValue.d3ConnectionLines.length > 0) {
                itemConnectionLines.active = true;
            }
            else {
                itemConnectionLines.active = false;
            }

        });

        /**
         * Watches broadcast event fro map.undo
         * Redo the recent change in data
         */
        $scope.$on('History.redone', function(event, data) {
            var itemErrorLines, itemConnectionLines;
            itemErrorLines = toolbar.getItemByID(toolbarItems.SHOW_ERROR_LINES);

            itemConnectionLines = toolbar.getItemByID(toolbarItems.SHOW_CONNECTION_LINES);

            if(data.oldValue.d3ErrorLines.length > 0) {
                itemErrorLines.active = true;
            }
            else {
                itemErrorLines.active = false;
            }

            if(data.oldValue.d3ConnectionLines.length > 0) {
                itemConnectionLines.active = true;
            }
            else {
                itemConnectionLines.active = false;
            }

        });
    }
})();
