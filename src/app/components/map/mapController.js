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

    angular.module('acjim.map',[])
        .controller('mapCtrl', ['$rootScope', '$scope', 'fileHandling', mapCtrl]);

    function mapCtrl ($rootScope, $scope, fileHandling) {

        function getErrorConnectionLines() {
            fileHandling.getErrorConnectionLines($scope.data, $scope.acd1).then(function (result) {
                $scope.data.d3Errorlines = result.d3ErrorLines;
                $scope.data.d3Connectionlines = result.d3ConnectionLines;
            });
        }


        /********************* LISTENERS ********************/

        /**
         * Watches for a the reoptimize button
         */
        $scope.$on('map.reOptimize', function () {
            fileHandling.reOptimize($scope.data, $scope.acd1, $scope.pointsMoved).then(function (result) {
                $scope.data = result;
            });
        });


        /**
         * Watches for a the errorlines button
         */
        $rootScope.$on('api.geterrorlines', function () {
            if ($rootScope.errorlinesShown !== true) {
                $scope.data.d3Errorlines = [];
                $scope.data.d3Connectionlines = [];

                getErrorConnectionLines();
            }
        });

        /** Watches for the Disable button with sress value
         *
         */
        $scope.$on('api.set_disconnected_points', function () {
            if ($rootScope.disableArrayFlag == true) {
                fileHandling.disableNodes($scope.data, $scope.acd1, $rootScope.disableArray);
            }

        });
        /** Watches for the Stress Value without stress value
         *
         */
        $scope.$on('api.set_disconnected_points2', function () {
            if ($rootScope.disableArrayFlag == true) {
                fileHandling.disableNodesWithoutStress($scope.data,  $scope.acd1,$rootScope.disableArray);
            }

        });
        /** Watches for New Map Create from Existing Map button
         *
         */
        $scope.$on('newMap.create', function () {
            if ($rootScope.disableArrayFlag == true) {
                fileHandling.createNewFileFromAlreadyExistingOne($scope.data, $scope.acd1, $rootScope.disableArray);
            }
        });
        /**
         * Watches for a the connectionlines button
         */
        $rootScope.$on('api.getconnectionlines', function () {
            if ($rootScope.connectionlinesShown !== true) {
                getErrorConnectionLines();
            }
        });

        /**
         * Watches for moved nodes while lines are displayed
         */
        $rootScope.$on('api.nudgeTriggeredErrorlines', function () {
            fileHandling.reOptimize($scope.data);
            getErrorConnectionLines();
        });
    }
})();
