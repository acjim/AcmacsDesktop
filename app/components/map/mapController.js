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

var app = angular.module('acjim.map',[]);

app.controller('mapCtrl', ['$scope', function($scope){

    $scope.d3Data = [];

    $scope.mapData.map.layout.forEach(function(layout, i) {
        $scope.d3Data[i] = {
            "x": layout[0],
            "y": layout[1]
        };
    });

    $scope.mapData.map.point_info.forEach(function(point_info, i) {

        var node_name = "undefined";

        if (!_.isUndefined(point_info.name)) {
            node_name = point_info.name;
        }

        $scope.d3Data[i].name = node_name;
    });

    $scope.mapData.map.styles.points.forEach(function(point, i) {

        var node_shape = "circle";
        var node_fill = "#000000";

        if (!_.isUndefined($scope.mapData.map.styles.styles[point].fill_color)) {
            node_fill = $scope.mapData.map.styles.styles[point].fill_color[0];
        }
        if (!_.isUndefined($scope.mapData.map.styles.styles[point].shape)) {
            node_shape = $scope.mapData.map.styles.styles[point].shape;
        }

        $scope.d3Data[i].style = {shape: node_shape, fill_color: node_fill};
    });
}]);