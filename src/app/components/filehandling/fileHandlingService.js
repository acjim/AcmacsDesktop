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

        return {
            handleFileOpen: handleFileOpen,
            handleFileSaveAs: handleFileSaveAs,
            reOptimize: reOptimize,
            getErrorConnectionLines: getErrorConnectionLines,
            disableNodes: disableNodes,
            disableNodesWithoutStress: disableNodesWithoutStress,
            createNewFileFromAlreadyExistingOne: createNewFileFromAlreadyExistingOne
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

        function handleFileSaveAs(filename) {

            //Known issue: https://github.com/nwjs/nw.js/wiki/File-dialogs#filter-file accept doesn't work with nwsaveas
            var extension = ".save";
            if((/[.]/.exec(filename))) {
                extension = /[^.]+$/.exec(filename);
            } else {
                filename = filename + extension;
            }
            var supported_extension = ["acd1","save","lispmds"];
            if(supported_extension.indexOf(extension.toString()) < 0){
                extension = "save";
            }
            var additional_params = {format: extension.toString(), filename: filename};
            var acd1file = "abc"; //TODO: THIS NEEDS FIXING. As acd1File isn't stored globally anymore, only acd1 from currently active ng-map should be used here.
            return api.export(acd1file, additional_params).then(function (output) {
                cfpLoadingBar.complete();
            }, function (reason) {
                return errorReason(reason);
            });

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
                        result.acd1File = output.output_acd1;
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
                            result.map   = parseLayoutData(JSON.parse(data[1]));
                            result.acd1File = output.output_acd1;
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
        function reOptimize(mapData, acd1, pointsMoved) {
            cfpLoadingBar.start();

            // check if a node is moved
            if (pointsMoved === true) {
                var list = [];
                mapData.layout.forEach(function (layout, i) {
                    list[i] = [
                        layout.x,
                        layout.y
                    ];
                });
                var additional_params = {
                    coordinates: list,
                    projection: acd1.projection
                };

                return api.new_projection(additional_params, acd1.acd1File)
                    .then(function (output) {
                        var output_json = output.output_json;
                        acd1.acd1File = output.output_acd1;
                        var output_data = fs.readFileSync(output_json, 'utf8');
                        var mapJsonData = JSON.parse(output_data);
                        acd1.projection = mapJsonData.projection;
                        return relax_existing(mapData, acd1);
                    }, function (reason) {
                        return errorReason(reason);
                    });
            } else {
                return relax_existing(mapData, acd1);
            }

        }

        function relax_existing(mapData, acd1)
        {
            var relax_additional_params = {
                projection: acd1.projection
            };
            return api.relax_existing(relax_additional_params, acd1.acd1File)
                .then(function (filename) {
                    acd1.acd1File = filename.updated_acd1;
                    var map_additional_params = {projection: acd1.projection};
                    return api.execute(api.get_commands().GET_MAP, map_additional_params, acd1.acd1File)
                        .then(function (filename) {
                            return $q.all([
                                readFile(filename)
                            ]).then(function(data) {
                                mapData = parseLayoutData(JSON.parse(data));
                                cfpLoadingBar.complete();
                                return mapData;
                            });
                        }, function (reason) {
                            return errorReason(reason);
                        });
                }, function (reason) {
                    return errorReason(reason);
                });
        }


        /**
         * Creates the data structure of the map data object and returns it.
         * @param data
         * @returns {{
         *      stress: Number,
         *      layout: Array,
         *      d3ConnectionLines: Array,
         *      d3ErrorLines: Array
         * }}
         */
        function parseLayoutData (data) {

            var oldMap = data.map;

            if (_.isUndefined(oldMap)) {
                //TODO: Throw error what went wrong
                return {};
            }

            var newData = {};
            newData.layout = [];
            newData.d3ConnectionLines = [];
            newData.d3ErrorLines = [];
            newData.stress = data.stress;

            oldMap.layout.forEach(function (layout, i) {
                newData.layout[i] = {
                    "x": layout[0],
                    "y": layout[1],
                    "id": i
                };
            });

            oldMap.point_info.forEach(function (point_info, i) {

                var node_name = "undefined";

                if (!_.isUndefined(point_info.name)) {
                    node_name = point_info.name;
                }

                newData.layout[i].name = node_name;
            });

            oldMap.styles.points.forEach(function (point, i) {
                newData.layout[i].style = oldMap.styles.styles[point];
            });

            // checking if the drawing order is available
            if (!_.isUndefined(oldMap.styles.drawing_order)) {

                // In case the drawing_order is defined, we order the nodes based on their drawing order.
                var order_list = oldMap.styles.drawing_order[0].concat(oldMap.styles.drawing_order[1]);
                var length = order_list.length;

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
                            temp = newData.layout[j - 1];
                            newData.layout[j - 1] = newData.layout[j];
                            newData.layout[j] = temp;

                        }

                    }

                }

            }

            return newData;
        }

        /**
         * Calls api to get data for error and connection lines
         */
        function getErrorConnectionLines(mapData, acd1){

            var result = {
                d3ErrorLines: [],
                d3ConnectionLines: []
            };

            cfpLoadingBar.start();

            //TODO set projection number from scope
            var additional_params = {};
            return api.execute(api.get_commands().ERROR_LINES, additional_params, acd1.acd1File).then(function (filename) {
                fs.readFile(filename, 'utf8', function (err, data) {
                    var mapJsonData = JSON.parse(data);
                    // relax returns array of error_lines.
                    calculateLines(mapJsonData.error_lines, mapData.layout, result);
                    cfpLoadingBar.complete();
                });
                return result;
            });
        }

        /**
         * Calls api to create a new file from an already existing one n
         * @param mapData and points to remove disabledPoints
         */
        function createNewFileFromAlreadyExistingOne(mapData, acd1, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: acd1.projection,
                disconnected: disabledPoints
            };
            console.log(disabledPoints);

            disabledPoints.sort(function (a, b) {
                return b - a;
            });
            console.log(disabledPoints);

            api.set_disconnected_points(disable_additional_params, acd1.acd1File)
                .then(function (filename) {
                    var new_acd1 = filename.updated_acd1;
                    var relax_additional_params = {
                        projection: acd1.projection
                    };
                    api.relax_existing(relax_additional_params, new_acd1)
                        .then(function (filename) {
                            var new_acd1 = filename.updated_acd1;
                            var input;
                            input = prompt('Imput the location of the file, including the file name?\n example: /home/idrissou/idrissou.acd1"');
                            if (input === null) {
                                alert("No File Name Entered, No New Map File Created");
                                return; //break out of the function early
                            }
                            else{
                                var new_file = input;
                                //"/home/idrissou/test.acd1";
                            }
                            var additional_params = {format: 'acd1', filename: new_file};
                            return api.export(new_acd1, additional_params).then(function (filename) {
                                alert("New Map Succesfully created at: "+new_file);
                                cfpLoadingBar.complete();
                            }, function (reason) {
                                return errorReason(reason);
                            });
                        }, function (reason) {
                            return errorReason(reason);
                        });
                }, function (reason) {
                    console.log(reason);
                    return errorReason(reason);
                });
        }

        /**
         * Calls api to disable nodes (without Sress) from a specific  map
         * @param mapData
         */
        function disableNodesWithoutStress(mapData, acd1, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: acd1.projection,
                unmovable: disabledPoints
            };
            //console.log(disabledPoints);

            disabledPoints.sort(function(a, b) {
                return b-a;
            });


            api.set_unmovable_points(disable_additional_params, acd1.acd1File)
                .then(function (filename) {
                    acd1.acd1File = filename.updated_acd1;


                    var output_json = filename.output_json;

                    var output_data = fs.readFileSync(output_json, 'utf8');
                    var mapJsonData = JSON.parse(output_data);
                    // mapData.stress = mapJsonData.stress;
                    cfpLoadingBar.complete();

                }, function (reason) {
                    console.log(reason);

                    return errorReason(reason);
                });


        }

        /**
         * Calls api to disable nodes from a specific  map
         * @param mapData
         */
        function disableNodes(mapData, acd1, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: acd1.projection,
                disconnected: disabledPoints
            };
            //console.log(disabledPoints);

            disabledPoints.sort(function(a, b) {
                return b-a;
            });
            //console.log(disabledPoints);


            api.set_disconnected_points (disable_additional_params, acd1.acd1File)
                .then(function (filename) {
                    acd1.acd1File = filename.updated_acd1;


                    var output_json = filename.output_json;

                    var output_data = fs.readFileSync(output_json, 'utf8');
                    //mapData.stress = mapJsonData.stress;
                    var map_additional_params = {projection: acd1.projection};
                    api.execute(api.get_commands().GET_MAP, map_additional_params, acd1.acd1File)
                        .then(function (filename) {
                            var output_json = filename;
                            fs.readFile(output_json, 'utf8', function (err, data) {
                                var mapJsonData = JSON.parse(data);
                                mapData.stress = mapJsonData.stress;
                                mapJsonData.map.layout.forEach(function (layout, i) {
                                    mapData.layout[i].x = layout[0];
                                    mapData.layout[i].y = layout[1];
                                });

                                var newfile = "/home/idrissou/malikou.acd1";
                                var additional_params = {format: 'acd1', filename: newfile};
                                return api.export(acd1.acd1File, additional_params).then(function (filename) {
                                    cfpLoadingBar.complete();
                                }, function (reason) {
                                    return errorReason(reason);
                                });

                            });
                        }, function (reason) {
                            return errorReason(reason);
                        });

                }, function (reason) {
                    console.log(reason);

                    return errorReason(reason);
                });

        }


        /**
         * Calculate error and connection lines
         * @param errorlines
         * @param layout
         * @param result
         * @returns {boolean}
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