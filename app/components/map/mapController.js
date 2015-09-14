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

    $scope.mapData.map[0].layout.forEach(function(point, i) {

        var node_name, node_style, node_shape, node_fill;

        var mapData = $scope.mapData.map[0];

        if (mapData && mapData.point_info && mapData.point_info[i]) {

            node_name = $scope.mapData.map[0].point_info[i].name;

        } else {
            node_name = "undefined";
        }
        if (mapData && mapData.styles && mapData.styles.points && mapData.styles.points[i] && mapData.styles.styles[mapData.styles.points[i]]) {

            node_shape = mapData.styles.styles[mapData.styles.points[i]].shape;
            node_fill = mapData.styles.styles[mapData.styles.points[i]].fill_color[0];

        } else {
            node_shape = "circle";
            node_fill = "#000000";
        }

        node_style = {shape: node_shape, fill_color: node_fill};

        $scope.d3Data.push({
            "x": point[0],
            "y": point[1],
            "name": node_name,
            "style": node_style
        });

    });
}]);