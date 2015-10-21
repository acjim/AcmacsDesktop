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


    $scope.d3Data = {};
    $scope.d3Data.d3Nodes = [];

    var fs = require('fs');
    var colorFlag=0;
    var lab,year;
    var map = $scope.mapData.map.map.map;

    /**
     * Watches for a the reoptimize button
     */
    $scope.$on('api.reoptimize', function() {
        reoptimize();
    });

    /**
     * Calls api to reoptimize (relax)
     */
    function reoptimize(){
        cfpLoadingBar.start();

        var list = [];
        $scope.d3Data.d3Nodes.forEach(function (layout, i) {
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
            $scope.mapData.acd1 = output_acd1;
            var fs = require('fs');
            fs.readFile(output_json, 'utf8', function (err, data) {
                var mapJsonData = JSON.parse(data);
                $scope.projection = mapJsonData.projection;
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
                    $scope.mapData.map.map.stress = stress;
                    mapJsonData.best_map.layout.forEach(function (layout, i) {
                        $scope.d3Data.d3Nodes[i].x = layout[0];
                        $scope.d3Data.d3Nodes[i].y = layout[1];
                    });
                    cfpLoadingBar.complete();
                });
            }, function (reason) {
                return $scope.errorReason(reason);
            });

        }, function (reason) {
            return $scope.errorReason(reason);
        });
    }

    // TODO: temporariliy located here error needs to be handled globally
    $scope.errorReason = function (reason) {
        cfpLoadingBar.complete();
        // TODO: set flash message based on environment
        var error_message = 'Unable to open the file, file import failed!';
        Flash.create('danger', error_message + "<br>\n" + reason);
        return (reason);
    };

    /**
     * Watches for a the errorlines button
     */
    $rootScope.$on('api.geterrorlines', function() {
        if($rootScope.errorlinesShown != true) {
            getErrorConnectionlines();
        }
    });

    /**
     * Watches for a the connectionlines button
     */
    $rootScope.$on('api.getconnectionlines', function() {
        if($rootScope.connectionlinesShown != true) {
            getErrorConnectionlines();
        }
    });

    /**
     * Watches for moved nodes while lines are displayed
     */
    $rootScope.$on('api.nudgeTriggeredErrorlines', function() {
        reoptimize();
        console.log($scope.projection);
        getErrorConnectionlines();
    });

    /**
     * Calls api to get data for error and connection lines
     */
    function getErrorConnectionlines(){
        $scope.d3Data.d3Errorlines = [];
        $scope.d3Data.d3Connectionlines = [];

        cfpLoadingBar.start();

        //TODO set projection number from scope
        var additional_params = {};
        api.execute(api.get_commands().ERROR_LINES, additional_params, $scope.mapData.acd1).then(function (filename) {
            fs.readFile(filename, 'utf8', function (err, data) {
                var mapJsonData = JSON.parse(data);
                // relax returns array of error_lines.
                $scope.mapData.map.error_lines = mapJsonData.error_lines;
                calculateLines();

                cfpLoadingBar.complete();
            });
        });
    }



    if ($scope.mapData.map.table.info.lab && $scope.mapData.map.table.info.date){
         lab = $scope.mapData.map.table.info.lab;
         year = $scope.mapData.map.table.info.date;
        colorFlag= 1;
    }
    else {
        // No possibility to draw colors
        colorFlag=0;
    }

    if (map) {

        if (_.isUndefined($scope.mapData.map)) return;

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

            var node_shape = "circle";
            var node_fill = "#000000";
            if (colorFlag==1) {
                node_fill =  colorNodes($scope.d3Data.d3Nodes[i].name,year);
            }
            if (!_.isUndefined(map.styles.styles[point].shape)) {
                node_shape = map.styles.styles[point].shape;
            }

            $scope.d3Data.d3Nodes[i].style = {shape: node_shape, fill_color: node_fill};
        });

        // checking if the drawing order is available
        if (!_.isUndefined(map.styles.drawing_order)) {
            // In case the drawing_order is defined, we order the nodes based on their drawing order.
            var order_list = map.styles.drawing_order[0].concat(map.styles.drawing_order[1]);
            var length = order_list.length;
            if ($scope.d3Data.d3Nodes.length == length) {
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
            } else {
                // keep ordering in default, meaning we don't do anything
            }
        }

        // Setting the color using the Hue Saturation Value Scheme
    }
        // function to color the nodes
    function colorNodes(name,year){
            var h, s, v;
            var firstChar = name.charAt(0);
            var secondChar= name.charAt(1);
            var initials =  firstChar+secondChar;
            // Computing the Hue Value
            if (isNumeric(firstChar)) {
                h = firstChar / 10;
            }
            else if (isLetter(firstChar)) {
                // Case Derek Trolling Dutch People
                if (initials.toUpperCase() == "NL" || initials.toUpperCase() == "BI" || initials.toUpperCase() == "RD" || initials.toUpperCase() == "UT" || initials.toUpperCase() == "AM") {
                    h = 0.1;
                }else{
                     if (firstChar.toUpperCase() == "A" ) {
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

     /**
     * Calculate error and connection lines
     */
    function calculateLines() {
        var errorlines = $scope.mapData.map.error_lines;
        var positive,
            connect,
            colour,
            selected = {},
            connection = {},
            pointsConnected = {};

        // Determine the sign of the error.
        // Created different calculation because Eugene was using on matrices on SVG DOM elements. (I think..)
        // Didn't want to touch DOM from here.
        positive = function (p1, p2, probe) {
            var dxa, dya, dxb, dyb, cross;

            // Assumption:
            // p1 and p2 are connected points
            // probe is the end of Error_Line, from viewpoint of p1
            // if probe lies on line inbetween points = red
            // if probe lies outside and is further away from p2 than p1 = blue

            // first check if probe is on line that runs through p1 and p2
            dxa = probe[0] - p1[0];
            dya = probe[1] - p1[1];

            dxb = p2[0] - p1[0];
            dyb = p2[1] - p1[1];

            cross = dxa * dyb - dya * dxb;
            //if cross equals zero, point is on line

            // compare x and y coordinates, whether probe lies between p1 and p2
            if (Math.abs(dxb) >= Math.abs(dyb)){
                if(dxb > 0){
                    return(
                        (p1[0] <= probe[0] && probe[0] <= p2[0]) ||
                        (p2[0] <= probe[0] && probe[0] <= pq[0])
                    );
                }

            }else {
                if(dyb > 0) {
                    return(
                        (p1[1] <= probe[1] && probe[1] <= p2[1]) ||
                        (p2[1] <= probe[1] && probe[1] <= p1[1])
                    );
                }
            }
        }

        //Connect lines (error/connection) in one direction
        connect = function(arg){
            var
            // The set of pre-calculated error line endpoints pointing to the
            // opposite end of each of the the current point's connections
                errorLineEnd,

            // The co-ordinates of the current line's origin
                from,

            // The co-ordinates of the current line's destination
                to,

                nAntigens = errorlines.antigens.length,
                nSera = errorlines.sera.length,

                originIndex,
                destIndex,
                o, d;

            for (o = 0; o < errorlines[arg.from].length; o += 1) {
                if (arg.from === 'antigens') {
                    originIndex = o;
                }
                else {
                    originIndex = nAntigens + o;
                }

                from = map.layout[originIndex];
                pointsConnected[from] = true;

                // Cache this point's selection status to reduce complex property
                // look-ups.
                selected[originIndex] = true;

                errorLineEnd = errorlines[arg.from][o];
                for (d = 0; d < errorLineEnd.length; d += 1) {
                    if (arg.from === 'antigens') {
                        destIndex = nAntigens + d;
                    }
                    else {
                        destIndex = d;
                    }

                    if (
                        connection[originIndex + ':' + destIndex] ||
                        connection[destIndex + ':' + originIndex]
                    ) {
                        // This connection has already been plotted.
                        continue;
                    }

                    to = map.layout[destIndex];

                    if (positive(from, to, errorLineEnd[d])) {
                        colour = 'red';
                    }
                    else {
                        colour = 'blue';
                    }

                    $scope.d3Data.d3Connectionlines.push({
                        //start: [from[0], from[1]],
                        //end: to,
                        x1: from[0],
                        y1: from[1],
                        x2: to[0],
                        y2: to[1],
                        stroke: 'grey',
                        width: 0.4,
                        opacity: 1.0
                    });

                    $scope.d3Data.d3Errorlines.push({
                        //start: [from[0], from[1]],
                        //end: errorLineEnd[d],
                        x1: from[0],
                        y1: from[1],
                        x2: errorLineEnd[d][0],
                        y2: errorLineEnd[d][1],
                        stroke: colour,
                        width: 0.6,
                        opacity: 1.0
                    });

                    // Mark this connection to allow testing for duplicates.
                    connection[originIndex + ':' + destIndex] = true;
                }
            } // for each origin: connection lines or the near-end error lines

            // Render the error lines at the opposite end of each connection
            for (d = 0; d < errorlines[arg.to].length; d += 1) {
                if (arg.from === 'antigens') {
                    destIndex = nAntigens + d;
                }
                else {
                    destIndex = d;
                }
                to = map.layout[destIndex];

                errorLineEnd = errorlines[arg.to][d];
                for (o = 0; o < errorLineEnd.length; o += 1) {
                    if (arg.from === 'antigens') {
                        originIndex = o;
                    }
                    else {
                        originIndex = nAntigens + o;
                    }
                    from = map.layout[originIndex];

                    if (connection[destIndex + ':' + originIndex]) {
                        // This connection has already been plotted.
                        continue;
                    }

                    // This filter selects only the error lines corresponding to selected points
                    if (selected[originIndex]) {
                        // Note the reversal of `to` and `from` in this case.
                        if (positive(to, from, errorLineEnd[o])) {
                            colour = 'red';
                        }
                        else {
                            colour = 'blue';
                        }

                        $scope.d3Data.d3Errorlines.push({
                            //start: [to[0], to[1]],
                            //end: errorLineEnd[o],
                            x1: to[0],
                            y1: to[1],
                            x2: errorLineEnd[o][0],
                            y2: errorLineEnd[o][1],
                            stroke: colour,
                            width: 0.6,
                            opacity: 1.0
                        });
                    }
                }
            } // renderErrorLines (at the opposite end)

        } //connet lines

        //probs leaving this out or moving it to different point
        if (!map || !errorlines) {
            console.log(map);
            console.log('ConnectionsLayer: bailing out because there is no data to plot');
            return false;
        }

        // First, draw the error lines for antigens
        connect({from: 'antigens', to: 'sera'});
        connect({from: 'sera', to: 'antigens'});
    }

}]);