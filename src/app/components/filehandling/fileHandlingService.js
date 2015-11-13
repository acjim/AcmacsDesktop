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
            'api',
            'Flash',
            'cfpLoadingBar',
            '$timeout',
            fileHandling
        ]);

    function fileHandling ($q, api, Flash, cfpLoadingBar, $timeout) {

        var acd1File = null;
        var projection = 0;

        return {
            handleFileOpen: handleFileOpen,
            reOptimize: reOptimize,
            getErrorConnectionlines: getErrorConnectionlines,
            updateTable: updateTable
        };

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
         * Callback function to handle the file opening
         * @param filename
         */
        function handleFileOpen (filename) {

            // Start loading bar
            $timeout(function() {
                cfpLoadingBar.start();
            }, 50);

            if (!fs.existsSync(config.api.script)) { // If there is no AcmacsCore.bundle
                return api.asyncTest().then(function() {
                    var output = api.stubOpen();
                    Flash.create('danger', 'Core api is missing, please add core api');

                    return $q.all([
                        readFile(output.table_json),
                        readFile(output.map_json)
                    ]).then(function(data) {
                        var result = {};
                        result.table = JSON.parse(data[0]);
                        result.map   = JSON.parse(data[1]);
                        acd1File = output.output_acd1;
                        return result;
                    });
                });
            } else {
                var additional_params = {};
                var table_additional_params = {}; // check documentation on execute>get_table for additional params
                var map_additional_params = {}; // check documentation on execute>get_map for what params can be passed

                return api.import_user_data(filename, additional_params).then(function (output) {
                    cfpLoadingBar.set(0.3);
                    return $q.all([
                        api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1),
                        api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1)
                    ]).then(function (data) {
                        var output_table_json = data[0];
                        var output_map_json   = data[1];
                        return $q.all([
                            readFile(output_table_json),
                            readFile(output_map_json)
                        ]).then(function(data) {
                            var result = {};
                            result.table = JSON.parse(data[0]);
                            result.map   = JSON.parse(data[1]);
                            acd1File = output.output_acd1;
                            return result;
                        });
                    }, function (reason) {
                        return errorReason(reason);
                    });
                }, function(reason) {
                    return errorReason(reason);
                });
            }
        }

        /**
         * Calls api to re-optimize (relax) the map
         * @param mapData
         */
        function reOptimize(mapData) {
            cfpLoadingBar.start();
            var list = [];
            mapData.d3Nodes.forEach(function (layout, i) {
                list[i] = [
                    layout.x,
                    layout.y
                ];
            });
            var additional_params = {
                coordinates: list,
                projection: projection
            };

            api.new_projection(additional_params, acd1File)
                .then(function (output) {
                    var output_json = output.output_json;
                    acd1File = output.output_acd1;
                    var output_data = fs.readFileSync(output_json, 'utf8');
                    var mapJsonData = JSON.parse(output_data);
                    projection = mapJsonData.projection;
                    var relax_additional_params = {
                        projection: projection
                    };
                    api.relax_existing(relax_additional_params, acd1File)
                        .then(function (filename) {
                            acd1File = filename.updated_acd1;
                            var map_additional_params = {projection: projection};
                            api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File)
                                .then(function (filename) {
                                    var output_json = filename;
                                    fs.readFile(output_json, 'utf8', function (err, data) {
                                        var mapJsonData = JSON.parse(data);
                                        mapData.stress = mapJsonData.stress;
                                        mapJsonData.map.layout.forEach(function (layout, i) {
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

        function updateTable(tableData, maps) {
            var version = tableData.version;
            var info = tableData.info;
            var table = tableData.table;
            var table_modified = (tableData.modified != undefined) ?  tableData.modified : false;
            if(table_modified == false)
            {
                Flash.create('danger', "Table has not been modified, unable to create new map");
                return;
            }
            cfpLoadingBar.start();
            var additional_params = {
                version: version,
                table: table,
                info: info,
                remove_existing_projections: table_modified // cannot be false if the points have been modified.
            };

            api.update_table(additional_params, acd1File)
                .then(function (output) {
                    acd1File = output; // update acd1 file

                    var relax_additional_params = {
                        number_of_dimensions: 2,
                        number_of_optimizations: 1,
                        best_map: true
                    };

                    api.relax(relax_additional_params, acd1File)
                        .then(function (filename) {
                            acd1File = filename.updated_acd1;
                            var output_json = filename.output_json;
                            fs.readFile(output_json, 'utf8', function (err, data) {

                                //TODO decide on which map should be updated: currently a new map is created
                                var mapJsonData = JSON.parse(data);
                                var mapData = {data: {map: '', stress: ''}, options: {}};
                                mapData.data.map = mapJsonData.best_map;
                                mapData.data.stress = mapJsonData.stresses[0];
                                for (var prop in maps) {
                                    var map =  maps[prop];
                                    break;
                                }
                                var id = maps.length;
                                mapData.options = map.options;
                                mapData.options.id = id;
                                mapData.options.title = 'Map '+ (id+1);
                                maps.push(mapData);

                                cfpLoadingBar.complete();

                            });
                        }, function (reason) {
                            return errorReason(reason);
                        });
                }, function (reason) {
                    return errorReason(reason);
                });
        }
    }
})();