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

        $scope.d3Data = {
            d3Nodes: [],
            stress: null
        };

        var map = $scope.mapData.map.map;

        function getErrorConnectionLines() {
            fileHandling.getErrorConnectionlines($scope.mapData.map).then(function (result) {
                $scope.d3Data.d3Errorlines = result.d3ErrorLines;
                $scope.d3Data.d3Connectionlines = result.d3ConnectionLines;
            });
        }

        if (map) {

            if (_.isUndefined($scope.mapData.map)) {
                return;
            }

            $scope.d3Data.stress = $scope.mapData.map.stress;

            map.layout.forEach(function (layout, i) {
                $scope.d3Data.d3Nodes[i] = {
                    "x": layout[0],
                    "y": layout[1]
                };
            });

            map.point_info.forEach(function (point_info, i) {

                var node_name = "undefined";

                if (!_.isUndefined(point_info.name)) {
                    node_name = point_info.name;
                }
                $scope.d3Data.d3Nodes[i].name = node_name;
            });

            map.styles.points.forEach(function (point, i) {
                $scope.d3Data.d3Nodes[i].style = map.styles.styles[point];
            });

            // checking if the drawing order is available
            if (!_.isUndefined(map.styles.drawing_order)) {
                // In case the drawing_order is defined, we order the nodes based on their drawing order.
                var order_list = map.styles.drawing_order[0].concat(map.styles.drawing_order[1]);
                var length = order_list.length;
                if ($scope.d3Data.d3Nodes.length === length) {
                    // start a bubble sort.
                    // The start of the sorting of drawing order following Bubble sort algorithm
                    for (var i = 0; i < length; i++) {
                        for (var j = (length - 1); j > 0; j--) {
                            if (order_list[j] < order_list[j - 1]) {
                                // swapping the order_list  to keep the reference
                                var temp = order_list[j - 1];
                                order_list[j - 1] = order_list[j];
                                order_list[j] = temp;
                                // swapping the data
                                temp = $scope.d3Data.d3Nodes[j - 1];
                                $scope.d3Data.d3Nodes[j - 1] = $scope.d3Data.d3Nodes[j];
                                $scope.d3Data.d3Nodes[j] = temp;
                            }
                        }
                    }
                }
            }
        }

        /********************* LISTENERS ********************/

        /**
         * Watches for a the reoptimize button
         */
        $scope.$on('api.reoptimize', function () {
            fileHandling.reOptimize($scope.d3Data, $rootScope.pointsMoved);
        });


        /**
         * Watches for a the errorlines button
         */
        $rootScope.$on('api.geterrorlines', function () {
            if ($rootScope.errorlinesShown !== true) {
                $scope.d3Data.d3Errorlines = [];
                $scope.d3Data.d3Connectionlines = [];

                getErrorConnectionLines();
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
            fileHandling.reOptimize($scope.d3Data);
            getErrorConnectionLines();
        });
    }
})();