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

        var acd1File = null;
        var projection = 0;
        var new_acd1 = "";
        var projection_comment = null;
        var is_changed = false;
        var original_filename = "";
        var fixedPoints = new Array();

        return {
            handleFileOpen: handleFileOpen,
            handleFileSaveAs: handleFileSaveAs,
            reOptimize: reOptimize,
            getNewProjection: getNewProjection,
            getErrorConnectionLines: getErrorConnectionLines,
            disconnectNodes: disconnectNodes,
            fixNodes: fixNodes,
            createNewFileFromAlreadyExistingOne: createNewFileFromAlreadyExistingOne,
            setMapIsChanged: setMapIsChanged,
            getMapIsChanged: getMapIsChanged,
            getOriginalFileName: getOriginalFileName,
            setFixedPoints: setFixedPoints
        };

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
         * @param filename
         * @param current_window
         * @param triggered_event
         * @returns {*}
         */
        function handleFileSaveAs(filename, current_window, triggered_event, mapData) {

            cfpLoadingBar.start();
            var acd1_file = acd1File;
            if (new_acd1.length > 0) {
                acd1_file = new_acd1;
                new_acd1 = "";
            }
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
                    acd1_file = output.output_acd1;
                    var output_json = output.output_json;
                    var data = fs.readFileSync(output_json, 'utf8');
                    var mapJsonData = JSON.parse(data);
                    var projection_number = mapJsonData.projection;
                    if(fixedPoints.length > 0) {
                        var disable_additional_params = {
                            projection: projection_number,
                            unmovable: fixedPoints
                        };
                        var op = api.set_unmovable_points_sync(disable_additional_params, acd1_file);
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

        function exportFile(filename, options) {
            // process extension and other export parameters
            var extension = ".save";
            if ((/[.]/.exec(filename))) {
                extension = /[^.]+$/.exec(filename);
            } else {
                filename = filename + extension;
            }
            var supported_extension = ["acd1", "save", "lispmds"];
            if (supported_extension.indexOf(extension.toString()) < 0) {
                extension = "save";
            }
            var export_params = {
                format: extension.toString(),
                filename: filename,
                projection: options.projection_number
            };
            return api.export(options.acd1_file, export_params).then(function () {
                cfpLoadingBar.complete();
                Flash.create('success', 'File saved successfully!');
                setMapIsChanged(false);
                removeExtraFiles();
                return {current_window: options.current_window, triggered_event: options.triggered_event};
            }, function (reason) {
                return errorReason(reason);
            });
        }

        /**
         * Callback function to handle the file opening
         * @param filename
         */
        function handleFileOpen(filename) {

            // Start loading bar
            $timeout(function () {
                cfpLoadingBar.start();
            }, 100);

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
            var filePath = getOriginalFileName() + ".~01~";
            if (fs.existsSync(filePath) && process.platform == 'darwin') {
                fs.unlinkSync(filePath);
            }
        }

        /**
         * Calls api to re-optimize (relax) the map
         * @param mapData
         * @param acd1
         * @param pointsMoved
         */
        function reOptimize(mapData, pointsMoved) {
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
                        if(fixedPoints.length > 0) {
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

        }


        /**
         * Creates a new projection without optimization
         * @param mapData
         * @param acd1
         * @returns {*}
         */
        function getNewProjection(mapData) {

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

                if(fixedPoints.length > 0) {
                    var disable_additional_params = {
                        projection: (projection == 0) ? projection : projection_comment,
                        unmovable: fixedPoints
                    };
                    var filename = api.set_unmovable_points_sync(disable_additional_params, acd1File);
                    acd1File = filename.updated_acd1;
                }

                var map_additional_params = {
                    projection: (projection == 0) ? projection : projection_comment
                };
                return api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File).then(function (data) {
                    return $q.all([
                        readFile(data)
                    ]).then(function (output_data) {
                        mapData = parseLayoutData(JSON.parse(output_data));
                        setMapIsChanged(true);
                        return mapData;
                    });

                }, function (reason) {
                    return errorReason(reason);
                });

            }, function (reason) {
                return errorReason(reason);
            });
        }


        function relax_existing(mapData) {
            var relax_additional_params = {
                projection: (projection == 0) ? projection : projection_comment
            };
            return api.relax_existing(relax_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    var map_additional_params = {projection: (projection == 0) ? projection : projection_comment};
                    return api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File)
                        .then(function (filename) {
                            return $q.all([
                                readFile(filename)
                            ]).then(function (data) {
                                mapData = parseLayoutData(JSON.parse(data));
                                setMapIsChanged(true);
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
        function getErrorConnectionLines(mapData) {
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
         * Calls api to create a new file from an already existing one n
         * @param mapData and points to remove disabledPoints
         */
        function createNewFileFromAlreadyExistingOne(mapData, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: (projection == 0) ? projection : projection_comment,
                disconnected: disabledPoints
            };
            disabledPoints.sort(function (a, b) {
                return b - a;
            });

            api.set_disconnected_points(disable_additional_params, acd1File)
                .then(function (filename) {
                    new_acd1 = filename.updated_acd1;
                    var relax_additional_params = {
                        projection: (projection == 0) ? projection : projection_comment
                    };
                    api.relax_existing(relax_additional_params, new_acd1)
                        .then(function (filename) {
                            new_acd1 = filename.updated_acd1;
                            // save the file using the selected (or non-selected points) and open the file in new window.
                            var data_path = api.get_data_path();
                            var output_file = api.create_file_path(data_path, acd1File, ".acd1", "np");
                            $rootScope.$broadcast('save-as', output_file);
                            $rootScope.$broadcast('open-file', output_file);
                        }, function (reason) {
                            return errorReason(reason);
                        });
                }, function (reason) {
                    return errorReason(reason);
                });
        }

        /**
         * Calls api to disable nodes (without Sress) from a specific  map
         * @param mapData
         */
        function fixNodes(mapData, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: (projection == 0) ? projection : projection_comment,
                unmovable: disabledPoints
            };

            api.set_unmovable_points(disable_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    setMapIsChanged(true);
                    setFixedPoints(disabledPoints);
                    cfpLoadingBar.complete();
                }, function (reason) {
                    return errorReason(reason);
                });
        }

        /**
         * Calls api to disable nodes from a specific  map
         * @param mapData
         */
        function disconnectNodes(mapData, disabledPoints) {
            cfpLoadingBar.start();

            var disable_additional_params = {
                projection: (projection == 0) ? projection : projection_comment,
                disconnected: disabledPoints
            };

            disabledPoints.sort(function (a, b) {
                return b - a;
            });


            api.set_disconnected_points(disable_additional_params, acd1File)
                .then(function (filename) {
                    acd1File = filename.updated_acd1;
                    var map_additional_params = {projection: (projection == 0) ? projection : projection_comment};
                    api.execute(api.get_commands().GET_MAP, map_additional_params, acd1File)
                        .then(function (filename) {
                            var output_json = filename;
                            fs.readFile(output_json, 'utf8', function (err, data) {
                                var mapJsonData = JSON.parse(data);
                                mapData.stress = mapJsonData.stress;
                                mapJsonData.map.layout.forEach(function (layout, i) {
                                    mapData.layout[i].x = layout[0];
                                    mapData.layout[i].y = layout[1];
                                });
                                cfpLoadingBar.complete();
                            });
                            setMapIsChanged(true);
                        }, function (reason) {
                            return errorReason(reason);
                        });

                }, function (reason) {
                    return errorReason(reason);
                });

        }


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
        function connect(arg, errorLines, layout, result) {
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
                        stroke: 'grey',
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
                    if (selected[originIndex]) {
                        // Note the reversal of `to` and `from` in this case.
                        if (positive(to, from, errorLineEnd[o])) {
                            colour = 'red';
                        }
                        else {
                            colour = 'blue';
                        }

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
        function calculateLines(errorLines, layout) {
            if (!layout || !errorLines) {
                return {};
            }
            var result = {
                d3ErrorLines: [],
                d3ConnectionLines: []
            };
            // First, draw the error lines for antigens
            connect({from: 'antigens', to: 'sera'}, errorLines, layout, result);
            //connect({from: 'sera', to: 'antigens'}, errorLines, layout, result);

            return result;
        }

        /**
         *
         * @returns {boolean}
         */
        function getMapIsChanged() {
            return is_changed;
        }

        /**
         * If opened map has been changed in any way set as true else false
         *
         * @param changed Boolean
         */
        function setMapIsChanged(changed) {
            if (is_changed !== changed) {
                is_changed = changed;
                if (is_changed) {
                    $document[0].title += "*";
                } else {
                    var str =  $document[0].title;
                    $document[0].title = str.substring(0, str.length - 1);
                }
            }
        }

        /**
         *
         * @returns {string} returns original file name
         */
        function getOriginalFileName() {
            return original_filename;
        }

        function setFixedPoints(fixedNodes)
        {
            fixedPoints = fixedNodes;
        }


    }
})();