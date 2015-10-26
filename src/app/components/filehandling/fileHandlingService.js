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

    var config = require('./config.js'),
        fs = require('fs');

    angular.module('acjim.fileHandling',['flash'])
        .factory('fileHandling', [
            '$q',
            'fileDialog',
            'api',
            'Flash',
            'cfpLoadingBar',
            fileHandling
        ]);


    function fileHandling ($q, fileDialog, api, Flash, cfpLoadingBar) {

        var tableData = null,
            acd1File = null,
            maps = [];

        var service = {
            newFile: newFile,
            openFileDialog: openFileDialog,
            openFile: handleFileOpen,
            reOptimize: reOptimize,
            getErrorConnectionlines: getErrorConnectionlines,
            getMaps: getMaps,
            getTable: getTableData
        };

        return service;

        ///////////////////

        function getTableData(){
            return tableData;
        }

        function getMaps() {
            return maps;
        }


        /**
         * Creates a new table to edit
         */
        function newFile () {
            //TODO: what happens if new file?
        }


        /**
         * Opens a specific file
         */
        function openFileDialog () {
            fileDialog.openFile(
                handleFileOpen,
                false,
                '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz'
            );
        }


        /**
         * Displays the error.
         * @param reason
         * @returns {Promise}
         */
        function errorReason (reason) {
            cfpLoadingBar.complete();
            // TODO: set flash message based on environment
            var error_message = 'Unable to open the file, file import failed!';
            Flash.create('danger', error_message+"<br>\n"+reason);
            return $q.reject(reason);
        }


        /**
         * Reads the file //TODO
         * @param filename
         * @returns {*}
         */
        function readFile (filename) {
            var deferred = $q.defer();
            fs.readFile(filename, 'utf8', function (err,data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }


        /**
         * Called when file opening is completed
         * @param output
         */
        function handleOpenComplete (output) {

            var output_acd1 = output.output_acd1;
            // parse file returned from table_filename to get json data related with table. NOTE: this file can only be json.
            var table_filename = output.table_json;
            // parse file returned from map_filename to get json data related with maps. NOTE: this file can only be json.
            var map_filename = output.map_json;

            $q.all([
                readFile(table_filename),
                readFile(map_filename)
            ]).then(function(data) {

                tableData = JSON.parse(data[0]);
                acd1File = output_acd1;
                maps.push(JSON.parse(data[1]));

            });
            cfpLoadingBar.complete();

        }


        /**
         * Callback function to handle the file opening
         * @param filename
         */
        function handleFileOpen (filename) {

            if (tableData != null) {
                //open file in new window
                window.open('index.html?fileToOpenOnStart=' + encodeURIComponent(filename));
                return;
            }

            // Start loading bar
            cfpLoadingBar.start();

            if (false && !fs.existsSync(config.api.path)) {

                api.asyncTest().then(function() {
                    var output = api.stubOpen();
                    var error_message = 'Core api is missing, please add core api';

                    Flash.create('danger', error_message);
                    handleOpenComplete(output);
                });

            } else {

                var additional_params = {};
                var table_additional_params = {}; // check documentation on execute>get_table for additional params
                var map_additional_params = {}; // check documentation on execute>get_map for what params can be passed

                api.import_user_data(filename, additional_params)
                    .then(function (output) {

                        cfpLoadingBar.set(0.3);

                        if (process.platform === "win32") { //vagrant can't handle 2 async calls
                            api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1).then(function (output1) {
                                cfpLoadingBar.set(0.6)
                                var output_table_json = output1;
                                api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1).then(function (output2) {
                                    var output_map_json = output2;
                                    handleOpenComplete({
                                        output_acd1: output.output_acd1,
                                        table_json: output_table_json,
                                        map_json: output_map_json
                                    });
                                }, function (reason) {
                                    return errorReason(reason);
                                });
                            }, function (reason) {
                                return errorReason(reason);
                            });
                        } else {

                            //under unix, asyncronous is faster
                            $q.all([
                                api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1),
                                api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1)
                            ]).then(function (data) {
                                var output_table_json = data[0];
                                var output_map_json = data[1];

                                handleOpenComplete({
                                    output_acd1: output.output_acd1,
                                    table_json: output_table_json,
                                    map_json: output_map_json
                                });
                            }, function (reason) {
                                return errorReason(reason);
                            });

                        }
                    }, function(reason) {
                        return errorReason(reason);
                    });
            }
        }


        /**
         * Calls api to re-optimize (relax) the map
         * @param mapData
         */
        function reOptimize(mapData){

            cfpLoadingBar.start();

            var list = [];
            mapData.d3Nodes.forEach(function (layout, i) {
                list[i] = [
                    layout.x,
                    layout.y
                ];
            });

            //TODO get projection from scope
            var additional_params = {
                coordinates: list,
                projection: 0
            };

            api.new_projection(additional_params, acd1File)
                .then(function (output) {

                    var output_json = output.output_json;
                    acd1File = output.output_acd1;

                    fs.readFile(output_json, 'utf8', function (err, data) {
                        //var mapJsonData = JSON.parse(data);
                        //$scope.projection = mapJsonData.projection;
                        //TODO set projection for all new_projection call
                    });

                    //TODO projection number should be passed further into relax function which is missing projection parameter
                    var relax_additional_params = {
                        number_of_dimensions: 2,
                        number_of_optimizations: 1,
                        best_map: true
                    };

                    api.execute(api.get_commands().RELAX, relax_additional_params, acd1File)
                        .then(function (filename) {

                            fs.readFile(filename, 'utf8', function (err, data) {

                                var mapJsonData = JSON.parse(data);

                                // relax returns list of stresses for number of optimizations performed.
                                mapData.stress = mapJsonData.stresses[0];

                                mapJsonData.best_map.layout.forEach(function (layout, i) {
                                    mapData.d3Nodes[i].x = layout[0];
                                    mapData.d3Nodes[i].y = layout[1];
                                });

                                cfpLoadingBar.complete();

                            });

                    }, function (reason) {
                        return errorReason(reason);
                    });

                }, function (reason) {
                    return errorReason(reason);
                });

        }


        /**
         * Calls api to get data for error and connection lines
         */
        function getErrorConnectionlines(mapData){

            var result = {
                d3ErrorLines: [],
                d3ConnectionLines: []
            };

            cfpLoadingBar.start();

            //TODO set projection number from scope
            var additional_params = {};
            return api.execute(api.get_commands().ERROR_LINES, additional_params, acd1File).then(function (filename) {

                fs.readFile(filename, 'utf8', function (err, data) {

                    var mapJsonData = JSON.parse(data);

                    // relax returns array of error_lines.
                    mapData.map.error_lines = mapJsonData.error_lines;
                    calculateLines(mapData.map.error_lines, mapData.map.layout, result); //TODO: why first apply to scope? then calculate??

                    cfpLoadingBar.complete();

                });

                return result;
            });

        }


        /**
         * Calculate error and connection lines
         */
        function calculateLines(errorlines, layout, result) {
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
            };

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

                    from = layout[originIndex];
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

                        to = layout[destIndex];

                        if (positive(from, to, errorLineEnd[d])) {
                            colour = 'red';
                        }
                        else {
                            colour = 'blue';
                        }

                        result.d3ConnectionLines.push({
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

                        result.d3ErrorLines.push({
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
                    to = layout[destIndex];

                    errorLineEnd = errorlines[arg.to][d];
                    for (o = 0; o < errorLineEnd.length; o += 1) {
                        if (arg.from === 'antigens') {
                            originIndex = o;
                        }
                        else {
                            originIndex = nAntigens + o;
                        }
                        from = layout[originIndex];

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

                            result.d3ErrorLines.push({
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

            }; //connet lines

            //probs leaving this out or moving it to different point
            if (!layout || !errorlines) {
                console.log('ConnectionsLayer: bailing out because there is no data to plot');
                return false;
            }

            // First, draw the error lines for antigens
            connect({from: 'antigens', to: 'sera'});
            connect({from: 'sera', to: 'antigens'});

        }

    }

})();