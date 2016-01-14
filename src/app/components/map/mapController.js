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

(function() {
    'use strict';

    angular.module('acjim.map',[])
        .controller('mapCtrl', ['$rootScope', '$scope', '$timeout', 'fileHandling', 'toolbar', 'toolbarItems', 'cfpLoadingBar', mapCtrl]);

    function mapCtrl ($rootScope, $scope, $timeout, fileHandling, toolbar, toolbarItems, cfpLoadingBar) {


        /**
         * Watches for a the reoptimize button
         */

        $scope.$on('map.reOptimize', function () {
            fileHandling.reOptimize($scope.data, $scope.pointsMoved).then(function (result) {
                $scope.pointsMoved = false;
                $scope.data = result;
                getErrorConnectionLines();
                cfpLoadingBar.complete();
            });
        });


        /**
         * Calls fileHandlingService for API call to backend to get Error & Connectionlines
         */
        function getErrorConnectionLines() {
            if (!$scope.showConnectionLines) { $scope.data.d3ConnectionLines = []; }
            if (!$scope.showErrorLines) { $scope.data.d3ErrorLines = []; }

            if ($scope.showConnectionLines || $scope.showErrorLines) {
                fileHandling.getErrorConnectionLines($scope.data).then(function (result) {
                    $scope.data.d3ConnectionLines = result.d3ConnectionLines;
                    $scope.data.d3ErrorLines = result.d3ErrorLines;

                    if (!$scope.showConnectionLines) { $scope.data.d3ConnectionLines = []; }
                    if (!$scope.showErrorLines) { $scope.data.d3ErrorLines = []; }
                });
            }
        }

        /**
         * Gets new Projection before calling Errorlines from API. This is necessary when nodes where moved, pushes information of new coordinates to backend.
         */
        function getProjectionBeforeErrorLines(){
            fileHandling.getNewProjection($scope.data).then(function(result) {
                $scope.pointsMoved = false;
                $scope.data = result;
                getErrorConnectionLines();
            });
        }

        /**
         * Watches for a the errorLines button
         */
        $rootScope.$on('map.showErrorLines', function (event, itemID) {
            var item = toolbar.getItemByID(toolbarItems.SHOW_ERROR_LINES);
            if (!itemID) { item.active = !item.active; }
            $scope.showErrorLines = item.active;
            if($scope.pointsMoved){
                getProjectionBeforeErrorLines()
            }else {
                getErrorConnectionLines();
            }
        });

        /**
         * Watches for a the connectionLines button
         */
        $rootScope.$on('map.showConnectionLines', function (event, itemID) {
            var item = toolbar.getItemByID(toolbarItems.SHOW_CONNECTION_LINES);
            if (!itemID) { item.active = !item.active; }
            $scope.showConnectionLines = item.active;
            if($scope.pointsMoved){
                getProjectionBeforeErrorLines()
            }else {
                getErrorConnectionLines();
            }
        });

        /**
         * Listens for nwjs menu item clicks and switches map tools accordingly
         */
        $rootScope.$on('map.selectionTool', function () {
            $timeout(function() {
                var item = toolbar.getItemByID(toolbarItems.SELECTION);
                item.click();
            });
        });
        $rootScope.$on('map.movementTool', function () {
            $timeout(function() {
                var item = toolbar.getItemByID(toolbarItems.MOVEMENT);
                item.click();
            });
        });

        /** Watches for the Disable button with sress value
         *
         */
        $scope.$on('api.set_disconnected_points', function () {
            if ($rootScope.disableArrayFlag == true) {
                fileHandling.disableNodes($scope.data, $rootScope.disableArray);
            }

        });

        /** Watches for the Stress Value without stress value
         *
         */
        $scope.$on('api.set_disconnected_points2', function () {
            if ($rootScope.disableArrayFlag == true) {
                fileHandling.disableNodesWithoutStress($scope.data, $rootScope.disableArray);
            }

        });

        /** Watches for New Map Create from opposite of Selected Nodes
         *
         */
        $scope.$on('newMap.create', function () {
            if ($rootScope.newMapArrayflag == true) {
                fileHandling.createNewFileFromAlreadyExistingOne($scope.data, $rootScope.newMapArray);
            }
        });
        /** Watches for New Map Create from   Selected Nodes
         *
         */
        $scope.$on('newMap.create2', function () {
            if ($rootScope.newMapArrayflag == true) {
                fileHandling.createNewFileFromAlreadyExistingOne($scope.data, $rootScope.newMapArray);
            }
        });

        /**
         * Watches for moved nodes while lines are displayed
         */
        $scope.$on('map.nudgeTriggered', function () {
            getProjectionBeforeErrorLines();
        });
    }
})();
