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

(function () {
    'use strict';

    var config = require('./config.js'),
        fs = require('fs');

    angular.module('acjim.fileHandling', ['flash'])
        .factory('fileHandling', [
            '$rootScope',
            '$q',
            'api',
            'Flash',
            'cfpLoadingBar',
            '$timeout',
            '$document',
            fileHandling
        ]);

    function fileHandling($rootScope, $q, api, Flash, cfpLoadingBar, $timeout, $document) {

            var acd1File = null,
            projection = 0,
            projection_comment = null,
            is_changed = false,
            original_filename = "",
            fixedPoints = [],
            disconnectedPoints = [],
            fileHandler = {},
            scale = 1,
            BlobData,
            globalData = new Array(),
            smoothing=0.5,
            subData = new Array(),
            globalsmallY,
            globalsmallX;

        /**
         * Displays errors that occurred
         * @param reason
         * @returns {Promise}
         */
        function errorReason(reason) {
            cfpLoadingBar.complete();

            // Get info message
            var rx = /INFO(.*)\[acmacs/g;
            var warnMsg = null;
            var arr = rx.exec(reason);
            if (_.isArray(arr) && arr[1]) {
                warnMsg = arr[1];
                console.warn('INFO:  ' + warnMsg);
            }

            // Get error message
            rx = /ERROR(.*)\n/g;
            arr = rx.exec(reason);
            if (_.isArray(arr) && arr[1]) {
                console.error('ERROR:  ' + arr[1]);
            }
            console.error(reason);

            //Build flash message
            var error_message = "<strong>Oops, that didn't go as expected!</strong></br>";
            if (warnMsg) {
                error_message += "Here is what could have gone wrong:</br>";
                error_message += warnMsg;
            } else {
                error_message += "Please check the log for errors or contact a developer.";
            }

            Flash.create('danger', error_message);
            Flash.pause();
            return $q.reject(reason);
        }


        /**
         * Reads the file //TODO
         * @param filename
         * @returns {*}
         */
        function readFile(filename) {
            var deferred = $q.defer();
            fs.readFile(filename, 'utf8', function (err, data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }


        /**
         * Handles the file save
         *
         * @param filename String
         * @param current_window Int
         * @param triggered_event evt
         * @param mapData list
         * @returns {*}
         */
        fileHandler.handleFileSaveAs = function (filename, current_window, triggered_event, mapData) {

            cfpLoadingBar.start();
            var acd1_file = acd1File;

            var list = [];
            mapData.layout.forEach(function (layout, i) {
                list[i] = [
                    layout.x,
                    layout.y
                ];
            });
            var additional_params = {
                coordinates: list,
                projection: projection
            };

            // get new projection before export
            return api.new_projection(additional_params, acd1_file)
                .then(function (output) {
                    var map_additional_params = {}; // check documentation on execute>get_map for what params can be passed

                    acd1_file = output.output_acd1;
                    var output_json = output.output_json;
                    var data = fs.readFileSync(output_json, 'utf8');
                    var mapJsonData = JSON.parse(data);
                    var projection_number = mapJsonData.projection;
                    // if there are fixed points, add those fixed points to latest projection as well.
                    if (fixedPoints.length > 0) {
                        var disable_additional_params = {
                            projection: projection_number,
                            unmovable: fixedPoints
                        };
                        var op = api.set_unmovable_points_sync(disable_additional_params, acd1_file); // TODO: what if you get error instead of output
                        acd1_file = op.updated_acd1;
                    }
                    exportFile(filename, {
                        current_window: current_window,
                        triggered_event: triggered_event,
                        acd1_file: acd1_file,
                        projection_number: projection_number
                    });
                }, function (reason) {
                    return errorReason(reason);
                });
        }

        /**
         * Export/Save file
         *
         * @param filename String
         * @param options Object
         * @returns {*} Object
         */
        function exportFile(filename, options) {
            // process extension and other export parameters
            var extension = ".save";
            if ((/[.]/.exec(filename))) {
                extension = /[^.]+$/.exec(filename);
            }
            var supported_extension = ["acd1", "save", "lispmds"];
            if (supported_extension.indexOf(extension.toString()) < 0) {
                extension = "save";
            }
            filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
            filename = filename + "." + extension;
            // if format is acd1 then remove all projections except for current projection to be exported
            if(extension.toString() == "acd1") {
                var rmvProjectionsParams = {keep: [options.projection_number], remove:[] };
                options.acd1_file = api.remove_projections_sync(rmvProjectionsParams, options.acd1_file); // TODO: what if you get error instead of output
            }
            var export_params = {
                format: extension.toString(),
                filename: filename,
                projection: options.projection_number
            };
            return api.export(options.acd1_file, export_params).then(function () {
                cfpLoadingBar.complete();
                Flash.create('success', 'File saved successfully!');
                fileHandler.setMapIsChanged(false);
                removeExtraFiles();
                return {current_window: options.current_window, triggered_event: options.triggered_event};
            }, function (reason) {
                return errorReason(reason);
            });
        }

        /**
         * Callback function to handle the file opening
         * @param filename String Name of file to be opened
         */
        fileHandler.handleFileOpen = function (filename) {

            // Start loading bar
            $timeout(function () {
                cfpLoadingBar.start();
            }, 77);

            if (!fs.existsSync(config.api.script)) { // If there is no AcmacsCore.bundle
                return api.asyncTest().then(function () {
                    var output = api.stubOpen();
                    Flash.create('danger', 'Core api is missing, please add core api');

                    return $q.all([
                        readFile(output.table_json),
                        readFile(output.map_json)
                    ]).then(function (data) {
                        var result = {};
                        result.table = JSON.parse(data[0]);
                        result.map = JSON.parse(data[1]);
                        acd1File = output.output_acd1;
                        return result;
                    });
                });
            } else {
                var additional_params = {};
                var table_additional_params = {}; // check documentation on execute>get_table for additional params
                var map_additional_params = {}; // check documentation on execute>get_map for what params can be passed
                original_filename = filename;
                return api.import_user_data(filename, additional_params).then(function (output) {
                    cfpLoadingBar.set(0.3);
                    return $q.all([
                        api.execute(api.get_commands().GET_TABLE, table_additional_params, output.output_acd1),
                        api.execute(api.get_commands().GET_MAP, map_additional_params, output.output_acd1)
                    ]).then(function (data) {
                        cfpLoadingBar.set(0.6);
                        var output_table_json = data[0];
                        var output_map_json = data[1];
                        return $q.all([
                            readFile(output_table_json),
                            readFile(output_map_json)
                        ]).then(function (data) {
                            cfpLoadingBar.set(0.9);
                            var result = {};
                            result.table = JSON.parse(data[0]);
                            result.map = parseLayoutData(JSON.parse(data[1]));
                            acd1File = output.output_acd1;
                            return result;
                        });
                    }, function (reason) {
                        return errorReason(reason);
                    });
                }, function (reason) {
                    return errorReason(reason);
                });
            }
        }

        /**
         * Deletes temporary files created by OSX
         * while solution is pretty static, but since the file (first)
         * generated always have same extension added to it; this works.
         */
        function removeExtraFiles() {
            var filePath = fileHandler.getOriginalFileName() + ".~01~";
            if (fs.existsSync(filePath) && process.platform == 'darwin') {
                fs.unlinkSync(filePath);
            }
        }

        /**
         * Calls api to re-optimize (relax) the map
         * @param mapData
         * @param pointsMoved
         */
        fileHandler.reOptimize = function (mapData, pointsMoved) {
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
                    projection: projection,
                    comment: "projection_" + projection
                };

                return api.new_projection(additional_params, acd1File)
                    .then(function (output) {
                        var output_json = output.output_json;
                        acd1File = output.output_acd1;
                        var output_data = fs.readFileSync(output_json, 'utf8');
                        var mapJsonData = JSON.parse(output_data);
                        projection = mapJsonData.projection;
                        projection_comment = mapJsonData.comment;
                        if (fixedPoints.length > 0) {
                            var disable_additional_params = {
                                projection: (projection == 0) ? projection : projection_comment,
                                unmovable: fixedPoints
                            };
                            var filename = api.set_unmovable_points_sync(disable_additional_params, acd1File);
                            acd1File = filename.updated_acd1;
                        }
                        return relax_existing(mapData);
                    }, function (reason) {
                        return errorReason(reason);
                    });
            } else {
                return relax_existing(mapData);
            }

        };


        /**
         * Creates a new projection without optimization
         *
         * @param mapData
         * @returns {*}
         */
        fileHandler.getNewProjection = function (mapData, blobsvalue) {
            var getblobs=false;
            if (blobsvalue==true){
                getblobs=true;
            }
            cfpLoadingBar.start();

            var list = [];
            mapData.layout.forEach(function (layout, i) {
                list[i] = [
                    layout.x,
                    layout.y
                ];
            });

            var additional_params = {
                coordinates: list,
                projection: projection,
                comment: "projection_" + projection
            };

            return api.new_projection(additional_params, acd1File).then(function (output) {
                var output_json = output.output_json;
                acd1File = output.output_acd1;
                var data = fs.readFileSync(output_json, 'utf8');
                var mapJsonData = JSON.parse(data);
                projection = mapJsonData.projection;
                projection_comment = mapJsonData.comment;

                if (fixedPoints.length > 0) {
                    var disable_additional_params = {
                        projection: (projection == 0) ? projection : projection_comment,
                        unmovable: fixedPoints
                    };
                    var filename = api.set_unmovable_points_sync(disable_additional_params, acd1File);
                    acd1File = filename.updated_acd1;
                }

                var map_additional_params = {
                    projection: (projection == 0) ? projection : projection_comment,
                    blobs: getblobs
                };
                return api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File).then(function (data) {
                    return $q.all([
                        readFile(data)
                    ]).then(function (output_data) {
                        mapData = parseLayoutData(JSON.parse(output_data));
                        fileHandler.setMapIsChanged(true);
                        return mapData;
                    });

                }, function (reason) {
                    return errorReason(reason);
                });

            }, function (reason) {
                return errorReason(reason);
            });
        };


        function relax_existing(mapData) {
            var relax_additional_params = {
                projection: (projection == 0) ? projection : projection_comment
            };
            return api.relax_existing(relax_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    var output_json = filename.output_json;
                    return $q.all([
                        readFile(output_json)
                    ]).then(function (data) {
                        var unprocessed_data = JSON.parse(data);
                        var progressive_data = [];
                        if(unprocessed_data.intermediate_layouts) {
                            var intermediate_size = unprocessed_data.intermediate_layouts.length;
                            var frequency = parseInt(intermediate_size / 77); // selected intermediate states so that total number of steps be 77 (77 has been selected randomly)
                            //@TODO, write an algorithm which finds most distinguished changes to show as animation/intermediate states
                            var count = 0;
                            unprocessed_data.intermediate_layouts.forEach(function (layout, index) {
                                if (index == 0 || (index % frequency) == 0 || isNaN(index % frequency) || index == intermediate_size) {
                                    progressive_data[count] = parseLayoutData(formatDataForIntermediateLayout(unprocessed_data, index));
                                    count++;
                                }
                            });
                        }
                        var map = unprocessed_data.map;
                        var map_data = {map:map[0], stress: map[0].stress};
                        mapData = parseLayoutData((map_data));
                        progressive_data[progressive_data.length] = mapData;
                        fileHandler.setMapIsChanged(true);
                        cfpLoadingBar.set(0.7);
                        return progressive_data;
                    });
                }, function (reason) {
                    return errorReason(reason);
                });
        }

        function formatDataForIntermediateLayout(data, index)
        {
            var map = data.map[0];
            var map_data = {map: {}};
            map_data.stress = data.intermediate_stresses[0][index];
            map_data.map.layout = data.intermediate_layouts[index];
            for (var property in map) {
                if (map.hasOwnProperty(property) && property != 'layout') {
                    map_data.map[property] = map[property];
                }
            }
            return map_data;
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
        function parseLayoutData(data) {

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
            newData.blobs = data.blobs;

            oldMap.layout.forEach(function (layout, i) {
                newData.layout[i] = {
                    "x": layout[0],
                    "y": layout[1],
                    "previouslySelected": false,
                    "selected": false,
                    "fixed": _.contains(fixedPoints, i),
                    "disconnected": _.contains(disconnectedPoints, i),
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
                // Computing blobs and centering them
            if (data.blobs){
                newData.blobs=computeBlobsCountour(data);
                for (var i=0; i< newData.blobs.length; i++){
                    for (var j= 0; j<newData.blobs[i].length; j++){
                        newData.blobs[i][j].x+=(newData.layout[i].x);
                        newData.blobs[i][j].y+=(newData.layout[i].y);
                    }
                }
            }

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
         *
         * @param mapData
         * @returns {*}
         */
        fileHandler.getErrorConnectionLines = function (mapData) {
            cfpLoadingBar.start();
            var additional_params = {projection: (projection == 0) ? projection : projection_comment};

            return api.execute(api.get_commands().ERROR_LINES, additional_params, acd1File).then(function (filename) {
                return $q.all([
                    readFile(filename)
                ]).then(function (data) {
                    // relax returns array of error_lines.
                    var result = calculateLines(JSON.parse(data).error_lines, mapData.layout);
                    cfpLoadingBar.complete();
                    return result;
                });
            });
        }

        /**
         * Calls api to create a new file from an already existing one
         * @param selectedNodes {{sera: Array, antigens: Array}}
         */
        fileHandler.createNewFileFromAlreadyExistingOne = function (selectedNodes) {
            cfpLoadingBar.start();

            var remove_antigens_sera = {
                antigens: selectedNodes.antigens,
                sera: selectedNodes.sera
            };

            api.remove_antigens_sera(remove_antigens_sera, acd1File)
                .then(function (filename) {
                    $rootScope.$broadcast('open-file', filename.output_acd1);
                    cfpLoadingBar.complete();



                }, function (reason) {
                    return errorReason(reason);
                });
        };


        /**
         * Calls api to disable nodes (without Stress) from a specific  map
         *
         * @param disabledPoints List
         */
        fileHandler.fixNodes = function (disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: (projection === 0) ? projection : projection_comment,
                unmovable: disabledPoints
            };

            api.set_unmovable_points(disable_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    //fileHandler.setMapIsChanged(true);
                    fileHandler.setFixedPoints(disabledPoints);
                    cfpLoadingBar.complete();
                }, function (reason) {
                    return errorReason(reason);
                });
        };

        /**
         * Calls api to disable nodes from a specific  map
         *
         * @param disabledPoints
         */
        fileHandler.disconnectNodes = function (mapData, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: (projection == 0) ? projection : projection_comment,
                disconnected: disabledPoints
            };

            disabledPoints.sort(function (a, b) {
                return b - a;
            });

            return api.set_disconnected_points(disable_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    var map_additional_params = {projection: (projection == 0) ? projection : projection_comment};
                    return api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File)
                        .then(function (filename) {
                            return $q.all([
                                readFile(filename)
                            ]).then(function (output_data) {
                                mapData = parseLayoutData(JSON.parse(output_data));
                                //fileHandler.setMapIsChanged(true);
                                fileHandler.setDisconnectedNodes(disabledPoints);
                                cfpLoadingBar.complete();
                                return mapData;
                            });

                        }, function (reason) {
                            return errorReason(reason);
                        });

                }, function (reason) {
                    return errorReason(reason);
                });

        };


        /**
         * Determine the sign of the error (line). Created different calculation because Eugene was using on matrices on SVG
         * DOM elements. (I think..). Didn't want to touch DOM from here.
         * Assumption: p1 and p2 are connected points, probe is the end of Error_Line, from viewpoint of p1
         * - if probe lies on line in between points = red
         * - if probe lies outside and is further away from p2 than p1 = blue
         * @param p1
         * @param p2
         * @param probe
         * @returns {boolean}
         */
        function positive(p1, p2, probe) {
            var dxa, dya, dxb, dyb, cross;

            // first check if probe is on line that runs through p1 and p2
            dxa = probe[0] - p1.x;
            dya = probe[1] - p1.y;

            dxb = p2.x - p1.x;
            dyb = p2.y - p1.y;

            //if cross equals zero, point is on line
            cross = dxa * dyb - dya * dxb;

            // compare x and y coordinates, whether probe lies between p1 and p2
            if (Math.abs(dxb) >= Math.abs(dyb)) {
                if (dxb > 0) {
                    return (
                        (p1.x <= probe[0] && probe[0] <= p2.x) ||
                        (p2.x <= probe[0] && probe[0] <= p1.x)
                    );
                }
            } else {
                if (dyb > 0) {
                    return (
                        (p1.y <= probe[1] && probe[1] <= p2.y) ||
                        (p2.y <= probe[1] && probe[1] <= p1.y)
                    );
                }
            }
        }


        /**
         * Connect lines (error/connection) in one direction
         * @param arg {{from: String, to: String}}
         * @param errorLines
         * @param layout
         * @param result
         */
        function connect(arg, errorLines, layout, result, partial_selection) {
            var errorLineEnd,   // The set of pre-calculated error line endpoints pointing to the opposite end of each of the the current point's connections
                from,           // The co-ordinates of the current line's origin
                to,             // The co-ordinates of the current line's destination
                nAntigens = errorLines.antigens.length,
                originIndex,
                destIndex,
                o, d,
                colour;

            var selected = {},
                connection = {},
                pointsConnected = {};

            for (o = 0; o < errorLines[arg.from].length; o += 1) {
                if (arg.from === 'antigens') {
                    originIndex = o;
                } else {
                    originIndex = nAntigens + o;
                }

                from = layout[originIndex];
                if(partial_selection == true && from.selected == false) {
                    continue;
                }
                pointsConnected[from] = true;

                // Cache this point's selection status to reduce complex property
                // look-ups.
                selected[originIndex] = true;

                errorLineEnd = errorLines[arg.from][o];
                for (d = 0; d < errorLineEnd.length; d += 1) {
                    if (arg.from === 'antigens') {
                        destIndex = nAntigens + d;
                    } else {
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
                        x1: from.x,
                        y1: from.y,
                        x2: to.x,
                        y2: to.y,
                        stroke: colour,
                        width: 0.4,
                        opacity: 1.0
                    });

                    result.d3ErrorLines.push({
                        x1: from.x,
                        y1: from.y,
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
            for (d = 0; d < errorLines[arg.to].length; d += 1) {
                if (arg.from === 'antigens') {
                    destIndex = nAntigens + d;
                }
                else {
                    destIndex = d;
                }
                to = layout[destIndex];
                if(partial_selection == true && to.selected == false) {
                    continue;
                }

                errorLineEnd = errorLines[arg.to][d];
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
                    if (selected[originIndex] || partial_selection) {
                        // Note the reversal of `to` and `from` in this case.
                        if (positive(to, from, errorLineEnd[o])) {
                            colour = 'red';
                        }
                        else {
                            colour = 'blue';
                        }

                        result.d3ConnectionLines.push({
                            x1: from.x,
                            y1: from.y,
                            x2: to.x,
                            y2: to.y,
                            stroke: color,
                            width: 0.4,
                            opacity: 1.0
                        });

                        result.d3ErrorLines.push({
                            x1: to.x,
                            y1: to.y,
                            x2: errorLineEnd[o][0],
                            y2: errorLineEnd[o][1],
                            stroke: colour,
                            width: 0.6,
                            opacity: 1.0
                        });
                    }
                }
            } // renderErrorLines (at the opposite end)

        }


        /**
         * Calculate error and connection lines
         * @param errorLines
         * @param layout
         @returns {{d3ErrorLines: Array, d3ConnectionLines: Array}}
         */
        function calculateLines(errorLines, layout, partial_selection) {
            if (!layout || !errorLines) {
                return {};
            }
            var result = {
                d3ErrorLines: [],
                d3ConnectionLines: []
            };
            // First, draw the error lines for antigens
            connect({from: 'antigens', to: 'sera'}, errorLines, layout, result, partial_selection);
            //connect({from: 'sera', to: 'antigens'}, errorLines, layout, result);

            return result;
        }

        /**
         * *This function computes the blobs raadi points, format data, and then returns a path
         */

        function computeBlobsCountour(dataElement){
            var data = new Array();
            var subData=new Array();
            var subData2=new Array();
            var counter=0;
            // computing the contour for every point
            dataElement.blobs.radii_for_points.forEach(function (d, i){
                subData = new Array();
                subData[counter] = pathFromPolar(dataElement.map.layout[i],d,smoothing);
                //data[counter2]=subData;
                data[counter]=subData;
                counter++;
            });
            //formating  the data
            for(var i=0; i< data.length; i++){
                BlobData= data[i];
                subData2 = new Array();
                var k=0;

                while(BlobData[0] == undefined){
                    BlobData.splice(0, 1);
                }
                BlobData=BlobData[0];
                for (var j=0; j< (BlobData.length);j++){
                    subData2[k] = {
                        "x": (BlobData[j][1])*scale,
                        "y": (BlobData[j][2])*scale
                    };
                    if (k!=0){
                        subData2[k+1] = {
                            "x": (BlobData[j][3][0])*scale,
                            "y": (BlobData[j][3][1])*scale
                        };
                        subData2[k+2] = {
                            "x": (BlobData[j][4][0])*scale,
                            "y": (BlobData[j][4][1])*scale
                        };
                        k=k+2;
                    }
                    k=k+1;
                }
                globalData[i] = subData2;
            }
            return globalData;
    }

        /**
         * This function calculate the Blob contour and returns a path for the blob
         * @param sera
         * @returns {Array}
         */
        function pathFromPolar (point, contour, smoothing) {
            // Local variables:
            var
            // The number of vertices
                n = contour.length,

            // * The list of path vertices
                vertex = [],

            // * Set a threshold for smooth edges whose appearance is indistinguishable
            // from a straight line segment.
                notRounded = (Math.abs(smoothing) < 1e-4),

            // * Vertex index
                i,

            // * Index angle
                alpha,

            // * A disposable 2D point
                p,

            // * The resulting path
                path = [];

            // From an array of vertices, calculate the co-ordinates of the spline curve
            // handle for the edge identified by the arguments `index` and `edge`
            // ('leading', 'trailing').
            function curveHandle(index, edge) {
                var
                    pi,
                    ni,
                    prev,
                    next,
                    o,
                    prevLength,
                    nextLength,
                    prevToNext,
                    handle,
                    rounded = smoothing / 2 || 0; // To avoid bizarre effects at smoothing > 0.5, divide by 2

                // The point whose curve handle we're calculating
                o = vertex[index];

                // Indices of previous and next points
                if (index > 0) {
                    pi = index - 1;
                }
                else {
                    pi = n - 1;
                }

                if (index < n - 1) {
                    ni = index + 1;
                }
                else {
                    ni = 0;
                }

                // The neighbors of `o`.
                prev = vertex[pi];
                next = vertex[ni];

                // Lengths of the edges connecting to `prev` and `next`
                prevLength = distance(prev, o);
                nextLength = distance(next, o);

                // Length of the chord between `prev` and `next`
                prevToNext = distance(prev, next);

                if (edge === 'trailing') {
                    handle = {
                        x: o.x + rounded * nextLength * (next.x - prev.x) / prevToNext,
                        y: o.y + rounded * nextLength * (next.y - prev.y) / prevToNext
                    };
                }
                else {
                    handle = {
                        x: o.x - rounded * prevLength * (next.x - prev.x) / prevToNext,
                        y: o.y - rounded * prevLength * (next.y - prev.y) / prevToNext
                    };
                }
                return handle;
            }

            // calculate vertices
            for (i = 0; i < n; i += 1) {
                alpha = i * 2.0 * Math.PI / n;
                vertex[i] = {};
                vertex[i].x = contour[i] * Math.cos(alpha);
                vertex[i].y = contour[i] * Math.sin(alpha);
            }

            // Calculate the first segment, starting at 12 o'clock.
            path[0] = ["M", vertex[0].x, vertex[0].y];

            // All segments between the first and the final.
            for (i = 1; i < n; i += 1) {
                if (notRounded) {
                    p = vertex[i];
                    path.push(["L", p.x, p.y]);
                } else {
                    p = curveHandle(i - 1, 'trailing');
                    path.push(["C", p.x, p.y]);
                    p = curveHandle(i, 'leading');
                    path[path.length - 1].push([p.x, p.y]);
                    p = vertex[i];
                    path[path.length - 1].push([p.x, p.y]);
                }
            }

            // The final segment
            if (notRounded) {
                p = vertex[0];
                path.push(["L", p.x, p.y]);
            } else {
                p = curveHandle(n - 1, 'trailing');
                path.push(["C", p.x, p.y]);
                p = curveHandle(0, 'leading');
                path[path.length - 1].push([p.x, p.y]);
                p = vertex[0];
                path[path.length - 1].push([p.x, p.y]);
            }

            // Terminate the path spec
            path[path.length - 1].push(['z']);

            return path;
        }; // pathFromPolar

        /**
         * Calculate Euclidean distance between two points. A point is an object
         * containing two properties named `x` and `y`.
         *
         * @method distance
         * @param {SVGPoint|Object} p1
         * @param {SVGPoint|Object} p2
         * @return Number distance
         */
        function  distance(p1, p2) {
            return Math.sqrt(
                (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
            );
        };

        /**
         *
         * @returns {boolean}
         */
        fileHandler.getMapIsChanged = function () {
            return is_changed;
        }

        /**
         * If opened map has been changed in any way set as true else false
         *
         * @param changed Boolean
         */
        fileHandler.setMapIsChanged = function (changed) {
            if (is_changed !== changed) {
                is_changed = changed;
                if (is_changed) {
                    $document[0].title += "*";
                } else {
                    var str = $document[0].title;
                    $document[0].title = str.substring(0, str.length - 1);
                }
            }
        }

        /**
         *
         * @returns {string} returns original file name
         */
        fileHandler.getOriginalFileName = function () {
            return original_filename;
        }

        /**
         * Set nodes selected to fixed.
         *
         * @param fixedNodes List
         */
        fileHandler.setFixedPoints = function (fixedNodes) {
            fixedPoints = fixedNodes;
        };

        /**
         * Set nodes selected to disconnected.
         *
         * @param fixedNodes List
         */
        fileHandler.setDisconnectedNodes = function (disconnectedNodes) {
            disconnectedPoints = disconnectedNodes;
        };

        /**
         *
         * @param data
         * @param maps
         */
        fileHandler.updateTable = function ($scope) {
            var data = $scope.data;
            var mapData = $scope.mapData;
            var tableData = data.table;
            var version = tableData.version;
            var info = tableData.info;
            var table = tableData.table;
            var table_modified = (data.modified != undefined) ? data.modified : false;
            if (table_modified == false) {
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
                    acd1File = output;
                    // NOTES: (reasons for why relax is used here)
                    // OBSERVATION: RESULT On Using: get_map() OR relax_existing() without relax
                    // Yields a error message "INFO: NO maps, execute relax first."
                    var relax_additional_params = {
                        number_of_dimensions: 2,
                        number_of_optimizations: 1,
                        best_map: true
                    };

                    return api.relax(relax_additional_params, acd1File)
                        .then(function (filename) {
                            acd1File = filename.updated_acd1;
                            var output_json = filename.output_json;
                            var data = fs.readFileSync(output_json, 'utf8');
                            var map_parsed = JSON.parse(data);
                            var best_map = map_parsed.best_map;
                            var stresses = map_parsed.stresses;
                            var map = {"map": best_map, "stress": stresses[0]};
                            var mapData = parseLayoutData(map);
                            fileHandler.setMapIsChanged(true);
                            cfpLoadingBar.complete();
                            $scope.mapData = mapData;
                        }, function (reason) {
                            return errorReason(reason);
                        });
                }, function (reason) {
                    return errorReason(reason);
                });
        }

        return fileHandler;
    }
})();