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

app.controller('mapCtrl', ['$rootScope', '$scope', 'cfpLoadingBar', 'api', function($rootScope, $scope, cfpLoadingBar, api) {

    /**
     * Watches for a the reoptimize button
     */
    $rootScope.$on('api.reoptimize', function() {
        cfpLoadingBar.start();
        console.log('reoptimize');

        var list = [];
        $scope.d3Data.forEach(function (layout, i) {
            list[i] = [
                layout.x,
                layout.y
            ];
        });
        var additional_params = {coordinates: list, projection: 0, map: true};
        api.execute(api.get_commands().NEW_PROJECTION, additional_params, $scope.mapData.acd1).then(function(filename){
            console.log(filename);
            var fs = require('fs');
            fs.readFile(filename, 'utf8', function (err,data) {
                var mapJsonData = JSON.parse(data);
                mapJsonData.map.layout.forEach(function (layout, i) {
                    $scope.d3Data[i].x = layout[0];
                    $scope.d3Data[i].y = layout[1];
                });
                cfpLoadingBar.complete();
            });
        });
    });

    $scope.d3Data = [];

    var map = $scope.mapData.map.map;

    if (map) {

        if (_.isUndefined($scope.mapData.map)) return;

        map.layout.forEach(function (layout, i) {
            $scope.d3Data[i] = {
                "x": layout[0],
                "y": layout[1]
            };
        });

        map.point_info.forEach(function (point_info, i) {

            var node_name = "undefined";

            if (!_.isUndefined(point_info.name)) {
                node_name = point_info.name;
            }

            $scope.d3Data[i].name = node_name;
        });

        map.styles.points.forEach(function (point, i) {

            var node_shape = "circle";
            var node_fill = "#000000";

            if (!_.isUndefined(map.styles.styles[point].fill_color)) {
                node_fill = map.styles.styles[point].fill_color[0];
            }
            if (!_.isUndefined(map.styles.styles[point].shape)) {
                node_shape = map.styles.styles[point].shape;
            }

            $scope.d3Data[i].style = {shape: node_shape, fill_color: node_fill};
        });
        // checking if the drawing order is available
        if (!_.isUndefined(map.styles.drawing_order)) {
            // In case the drawing_order is defined, we order the nodes based on their drawing order.
            var order_list = map.styles.drawing_order[0].concat(map.styles.drawing_order[1]);
            var length = order_list.length;
            if ($scope.d3Data.length == length) {
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
                            temp = $scope.d3Data[j - 1];
                            $scope.d3Data[j - 1] = $scope.d3Data[j];
                            $scope.d3Data[j] = temp;
                        }
                    }
                }
            } else {
                // keep ordering in default, meaning we don't do anything
            }
        }

        // Setting the color using the Hue Saturation Value Scheme
        if (!_.isUndefined($scope.table)) {
            // Missing Isolate
            // $scope.info.assay;
            var name = $scope.table.info.assay;
            var isolate = $scope.table.info.assay;
            var year = $scope.table.info.date;
            var h, s, v;
            var firstChar = name.charAt(0);

            // Computing the Hue Value
            if (isNumeric(firstChar)) {
                h = firstChar / 10;
            }
            else if (isLetter(firstChar)) {
                // Case Derek Trolling Dutch People
                if (name.toUpperCase == "NL" || name.toUpperCase == "BI" || name.toUpperCase == "RD" || name.toUpperCase == "UT" || name.toUpperCase == "AM") {
                    h = 0.1;
                } else if (firstChar.toUpperCase() == "A" || firstChar == "A") {
                    h = 0 / 25;
                } else if (firstChar.toUpperCase() == "B" || firstChar == "B") {
                    h = 2 / 25;
                } else if (firstChar.toUpperCase() == "C" || firstChar == "C") {
                    h = 3 / 25;
                } else if (firstChar.toUpperCase() == "D" || firstChar == "D") {
                    h = 4 / 25;
                } else if (firstChar.toUpperCase() == "E" || firstChar == "E") {
                    h = 5 / 25;
                } else if (firstChar.toUpperCase() == "F" || firstChar == "F") {
                    h = 6 / 25;
                } else if (firstChar.toUpperCase() == "G" || firstChar == "G") {
                    h = 7 / 25;
                } else if (firstChar.toUpperCase() == "H" || firstChar == "H") {
                    h = 8 / 25;
                } else if (firstChar.toUpperCase() == "I" || firstChar == "I") {
                    h = 9 / 25;
                } else if (firstChar.toUpperCase() == "J" || firstChar == "J") {
                    h = 10 / 25;
                } else if (firstChar.toUpperCase() == "K" || firstChar == "K") {
                    h = 11 / 25;
                } else if (firstChar.toUpperCase() == "L" || firstChar == "L") {
                    h = 12 / 25;
                } else if (firstChar.toUpperCase() == "M" || firstChar == "M") {
                    h = 13 / 25;
                } else if (firstChar.toUpperCase() == "N" || firstChar == "N") {
                    h = 1 / 25;
                } else if (firstChar.toUpperCase() == "O" || firstChar == "O") {
                    h = 14 / 25;
                } else if (firstChar.toUpperCase() == "P" || firstChar == "P") {
                    h = 15 / 25;
                } else if (firstChar.toUpperCase() == "Q" || firstChar == "Q") {
                    h = 16 / 25;
                } else if (firstChar.toUpperCase() == "R" || firstChar == "R") {
                    h = 17 / 25;
                } else if (firstChar.toUpperCase() == "S" || firstChar == "S") {
                    h = 18 / 25;
                } else if (firstChar.toUpperCase() == "T" || firstChar == "T") {
                    h = 19 / 25;
                } else if (firstChar.toUpperCase() == "U" || firstChar == "U") {
                    h = 20 / 25;
                } else if (firstChar.toUpperCase() == "V" || firstChar == "V") {
                    h = 21 / 25;
                } else if (firstChar.toUpperCase() == "W" || firstChar == "W") {
                    h = 22 / 25;
                } else if (firstChar.toUpperCase() == "X" || firstChar == "X") {
                    h = 23 / 25;
                } else if (firstChar.toUpperCase() == "Y" || firstChar == "Y") {
                    h = 24 / 25;
                } else if (firstChar.toUpperCase() == "Z" || firstChar == "Z") {
                    h = 25 / 25;
                }
                else {
                    // we don't have a way to compute the H value, meaning we can't compute the color
                }
            } else {
                // Not Numeric and not Alphabet, meaning it is special charachters. Not taken into consideration
            }


        } else {
            // we can't compute the color.
        }
    }

    // computing the Saturation
    if(!isNumeric(isolate)){
        s=0.5;
    } else{
        s=(log20(isolate)/5);
    }

    // Computing the Value
    if (isNumeric(year)){
        v=1;
    }
    else{
        v=0;
    }

    // computing the total if all flags are 1


    function log20(val) {
        return (Math.log(n)) / (Math.log(20));
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function isLetter(letter) {
        if (letter.toLowerCase() != letter) {
            return true;
        }
        else {
            return false;
        }
    }
    // HSVtoRGB
    function HSVtoRGB(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }


}]);