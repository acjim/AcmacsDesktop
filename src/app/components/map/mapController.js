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

var app = angular.module('acjim.map',['flash']);

app.controller('mapCtrl', ['$rootScope', '$scope', 'cfpLoadingBar', 'api', 'Flash', function($rootScope, $scope, cfpLoadingBar, api, Flash) {


    /**
     * Watches for a the reoptimize button
     */
    $scope.$on('api.reoptimize', function () {
        cfpLoadingBar.start();

        var list = [];
        $scope.d3Data.forEach(function (layout, i) {
            list[i] = [
                layout.x,
                layout.y
            ];
        });

        //TODO get projection from scope
        var additional_params = {coordinates: list, projection: 0};
        api.new_projection(additional_params, $scope.mapData.acd1).then(function (output) {
            var output_json = output.output_json;
            var output_acd1 = output.output_acd1;
            var fs = require('fs');
            fs.readFile(output_json, 'utf8', function (err, data) {
                var mapJsonData = JSON.parse(data);
                var projection = mapJsonData.projection;
                var stress = mapJsonData.projection;
                //$scope.mapData.map.stress = stress;
                //TODO set projection for all new_projection call
            });

            //TODO projection number should be passed further into relax function which is missing projection parameter
            var relax_additional_params = {number_of_dimensions: 2, number_of_optimizations: 3, best_map: true};
            api.execute(api.get_commands().RELAX, relax_additional_params, output_acd1).then(function (filename) {
                var fs = require('fs');
                fs.readFile(filename, 'utf8', function (err, data) {
                    var mapJsonData = JSON.parse(data);
                    // relax returns list of stresses for number of optimizations performed.
                    var stress = mapJsonData.stresses[0];
                    $scope.mapData.map.map.map.stress = stress;
                    mapJsonData.best_map.layout.forEach(function (layout, i) {
                        $scope.d3Data[i].x = layout[0];
                        $scope.d3Data[i].y = layout[1];
                    });
                    cfpLoadingBar.complete();
                });
            }, function (reason) {
                return $scope.errorReason(reason);
            });

        }, function (reason) {
            return $scope.errorReason(reason);
        });
    });

    // TODO: temporariliy located here error needs to be handled globally
    $scope.errorReason = function (reason) {
        cfpLoadingBar.complete();
        // TODO: set flash message based on environment
        var error_message = 'Unable to open the file, file import failed!';
        Flash.create('danger', error_message + "<br>\n" + reason);
        return $q.reject(reason);
    };

    $scope.d3Data = [];

    var colorFlag=0;
    var lab,year;
    var map = $scope.mapData.map.map.map;

    if ($scope.mapData.map.table.info.lab && $scope.mapData.map.table.info.date){
         lab = $scope.mapData.map.table.info.lab;
         year = $scope.mapData.map.table.info.date;
        colorFlag= 1;
    }
    else {
        alert("not defined");
    }


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

            if (colorFlag==1) {
                node_fill =  colorNodes(lab,year);
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
    }

    function colorNodes(name,year){
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
                } else if (firstChar.toUpperCase() == "A" ) {
                    h = 0 / 25;
                } else if (firstChar.toUpperCase() == "B" ) {
                    h = 1 / 25;
                } else if (firstChar.toUpperCase() == "C" ) {
                    h = 2 / 25;
                } else if (firstChar.toUpperCase() == "D" ) {
                    h = 3 / 25;
                } else if (firstChar.toUpperCase() == "E" ) {
                    h = 4 / 25;
                } else if (firstChar.toUpperCase() == "F" ) {
                    h = 5 / 25;
                } else if (firstChar.toUpperCase() == "G" ) {
                    h = 6 / 25;
                } else if (firstChar.toUpperCase() == "H" ) {
                    h = 7 / 25;
                } else if (firstChar.toUpperCase() == "I" ) {
                    h = 8 / 25;
                } else if (firstChar.toUpperCase() == "J") {
                    h = 9 / 25;
                } else if (firstChar.toUpperCase() == "K") {
                    h = 10 / 25;
                } else if (firstChar.toUpperCase() == "L") {
                    h = 11 / 25;
                } else if (firstChar.toUpperCase() == "M") {
                    h = 12 / 25;
                } else if (firstChar.toUpperCase() == "N") {
                    h = 13 / 25;
                } else if (firstChar.toUpperCase() == "O") {
                    h = 14 / 25;
                } else if (firstChar.toUpperCase() == "P") {
                    h = 15 / 25;
                } else if (firstChar.toUpperCase() == "Q") {
                    h = 16 / 25;
                } else if (firstChar.toUpperCase() == "R") {
                    h = 17 / 25;
                } else if (firstChar.toUpperCase() == "S") {
                    h = 18 / 25;
                } else if (firstChar.toUpperCase() == "T") {
                    h = 19 / 25;
                } else if (firstChar.toUpperCase() == "U") {
                    h = 20 / 25;
                } else if (firstChar.toUpperCase() == "V") {
                    h = 21 / 25;
                } else if (firstChar.toUpperCase() == "W") {
                    h = 22 / 25;
                } else if (firstChar.toUpperCase() == "X") {
                    h = 23 / 25;
                } else if (firstChar.toUpperCase() == "Y") {
                    h = 24 / 25;
                } else if (firstChar.toUpperCase() == "Z") {
                    h = 25 / 25;
                }
                else {
                    // we don't have a way to compute the H value, meaning we can't compute the color
                }
            } else {
                // Not Numeric and not Alphabet, meaning it is special charachters. Not taken into consideration
            }


    /* Saturation Temporary not being Taken into consideration. Refer to Pr. Moore
    // computing the Saturation
    if(!isNumeric(isolate)){
        s=0.5;
    } else{
        s=(log20(isolate)/5);
    }*/
        // saturation being given the maximum value now as suggested by Pr.Moore
    s=1;
    // Computing the Value
   var splitedYear = year.split("-");
        v=1;
     for(var i=0;i<splitedYear.length; i++){
         if (!isNumeric(splitedYear[i])){
             v=0;
         }
     }
        var rgbValueArray= HSVtoRGB(h,s,v);
        return "rgb("+rgbValueArray.r+","+rgbValueArray.g+","+rgbValueArray.b+")";

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