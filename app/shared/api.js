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

//var sys = require('sys');
var config = require('./config.js');
var exec = require('child_process').exec;
var fs = require('fs');
var DATE_NOW = Date.now();

angular.module('acjim.api', [])
    .factory('api', ['$q', '$timeout', function ($q, $timeout) {
        var api = {};
        /**
         * creates json file with input parameters
         * for example: input.json - json object telling acmacs core api what to do
         *
         * @param command
         * @param additional_params
         * @param input_file
         * @returns {string}
         */
        api.create_input_parameter = function (command, additional_params, input_file) {
            var store_path = config.store.temp;
            switch (command) {
                case 'import':
                    var file_name = 'input';
                    var input_parameter = {};
                    input_parameter.command = 'import';
                    input_parameter.data = {};
                    // check if additional_params has name property else file_name= input_TIMESTAMP().json
                    if ('name' in additional_params) {
                        file_name = additional_params.name;
                        input_parameter.data.name = file_name;
                    } else {
                        var data_name = this.extract_name(input_file);
                        input_parameter.data.name = data_name.replace('-', '_');
                    }
                    file_name = file_name + '_' + DATE_NOW + ".json";

                    if (additional_params.hasOwnProperty('parse_antigen_names')) {
                        input_parameter.data.parse_antigen_names = additional_params.parse_antigen_names;
                    } else {
                        input_parameter.data.parse_antigen_names = false;
                    }
                    break;
                case 'get_table':
                    var input_parameter = {command: 'get_table', data: {}};
                    var file_name = this.extract_name(input_file);
                    file_name = file_name + '_' + DATE_NOW + ".json";
                    break;
                case 'get_map':
                    var input_parameter = {command: 'get_map', data: {projection: 0}};
                    if (additional_params.hasOwnProperty('projection')) {
                        var projection = additional_params.projection;
                        var input_parameter = {command: 'get_map', data: {projection: projection}};
                    }
                    input_parameter.data.error_lines = false;
                    input_parameter.data.blob_stress_diff = 0.1;
                    input_parameter.data.blob_number_of_directions = 36;
                    input_parameter.data.blobs = false;

                    if (additional_params.hasOwnProperty('error_lines')) {
                        input_parameter.data.error_lines = additional_params.error_lines;
                    }
                    if (additional_params.hasOwnProperty('blob_stress_diff')) {
                        input_parameter.data.blob_stress_diff = additional_params.blob_stress_diff;
                    }
                    if (additional_params.hasOwnProperty('blob_number_of_directions')) {
                        input_parameter.data.blob_number_of_directions = additional_params.blob_number_of_directions;
                    }
                    if (additional_params.hasOwnProperty('blobs')) {
                        input_parameter.data.blobs = additional_params.blobs;
                    }

                    var file_name = this.extract_name(input_file);
                    var random_number = Math.random() * 89;
                    file_name = file_name + '_' + DATE_NOW + random_number + ".json";
                    break;
                default :
                    break;
            }
            var json_parameters = JSON.stringify(input_parameter, null, 4);
            var file_path = store_path + file_name;
            fs.writeFile(file_path, json_parameters, function (err) {
                if (err) {
                    throw err;
                }
            });

            return file_path;
        };

        /**
         * first step of the api call, import user data and return acd1 file (used for further processing)
         *
         * @param input_file
         * @param task
         * @param additional_params
         * @returns {{output_acd1: *, table_json: *, map_json: *}}
         */
        api.import_user_data = function (input_file, task, additional_params) {

            var deferred = $q.defer();

            var command = "import";
            // @todo get parameters name ,and parse_antigen_names (boolean) from user
            //var additional_params = {name: 'test_file', parse_antigen_names: true};
            //var additional_params = {};
            var store_path = config.store.temp;
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, input_file);

            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                } else if (task === 'new-open') {
                }
                //sys.puts(stdout);
                deferred.resolve({input_file: input_file, output_acd1: output_acd1}); // return call
            }

            var script = config.api.script;
            var data_path = config.store.path;
            var output_json = this.create_file_path(data_path, input_file, '.json', '');
            var output_acd1 = this.create_file_path(data_path, input_file, '.acd1', '');
            var command = script + input_param_file + " " + input_file + " " + output_json + " " + output_acd1;
            // callback function for exec
            try {
                exec(command, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            /*
            var output_table_json = this.create_file_path(data_path, input_file, '.json', 'table');
            var output_map_json = this.create_file_path(data_path, input_file, '.json', 'map');
            var output = {
                "output_acd1": output_acd1,
                "table_json": output_table_json,
                "map_json": output_map_json,
            }
            return output;*/
            return deferred.promise;
        };

        api.get_table_data = function (input_file, output_acd1) {
            var deferred = $q.defer();
            var command = "get_table";
            // @todo get data params from user (question: what data parameters are supported)
            var additional_params = {};
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, input_file);
            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                }
                deferred.resolve(stdout); // return call
            }

            var script = config.api.script;
            var data_path = config.store.path;
            var output_json = this.create_file_path(data_path, input_file, '.json', 'table');
            var command = script + input_param_file + " " + output_acd1 + " " + output_json;
            try {
                exec(command, puts);
            } catch (Error) {
                console.log('get_table - ' + Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        api.get_map = function (input_file, output_acd1) {
            var deferred = $q.defer();
            var command = "get_map";
            // @todo get data params from user (question: what data parameters are supported)
            var additional_params = {};
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, input_file);
            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                }
                deferred.resolve(stdout); // return call
                //sys.puts(stdout);
            }

            var script = config.api.script;
            var data_path = config.store.path;
            var output_json = this.create_file_path(data_path, input_file, '.json', 'map');
            var command = script + input_param_file + " " + output_acd1 + " " + output_json;
            //console.log(command);
            try {
                exec(command, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        api.relax_map = function () {
            var command = "relax";
        };

        api.make_new_projection = function () {
            var command = "make_new_projection_and_relax";
        };

        api.create_file_path = function (path, file_name, extension, extra) {
            var file = file_name.split('/').pop();
            var date_now = DATE_NOW;
            if (extra.length <= 0) {
                var output = path + file.substr(0, file.lastIndexOf(".")) + '_' + date_now + extension;
            } else {
                var output = path + file.substr(0, file.lastIndexOf(".")) + '_' + extra + '_' + date_now + extension;
            }

            return output;
        };

        api.extract_name = function (file_name) {
            var file = file_name.split('/').pop();
            var output = file.substr(0, file.lastIndexOf("."));
            return output;
        };

        api.date_now = function () {
            // maintain single instance of date through out the request
            return DATE_NOW;
        };

        api.stub = function () {
            var output = {
                "output_acd1": 'output_EU.acd1',
                "table_json": './test/data/get_table_concentric.json',
                "map_json": './test/data/get_map.json',
            }
            return output;
        };

        api.asyncTest = function() {
            var deferred = $q.defer();

            $timeout(function() {
                deferred.resolve(['Hello', 'world!']);
            }, 200);

            return deferred.promise;
        };

        return api;
    }]);

//
//module.exports = {
//
//    /**
//     * creates json file with input parameters
//     * for example: input.json - json object telling acmacs core api what to do
//     *
//     * @param command string
//     * @param additional_params object
//     * @param input_file string
//     * @returns {string}
//     */
//    create_input_parameter: function (command, additional_params, input_file) {
//        var store_path = config.store.temp;
//        switch (command) {
//            case 'import':
//                var file_name = 'input';
//                var input_parameter = {};
//                input_parameter.command = 'import';
//                input_parameter.data = {};
//                // check if additional_params has name property else file_name= input_TIMESTAMP().json
//                if ('name' in additional_params) {
//                    file_name = additional_params.name;
//                    input_parameter.data.name = file_name;
//                } else {
//                    var data_name = this.extract_name(input_file);
//                    input_parameter.data.name = data_name.replace('-', '_');
//                }
//                file_name = file_name + '_' + DATE_NOW + ".json";
//
//                if (additional_params.hasOwnProperty('parse_antigen_names')) {
//                    input_parameter.data.parse_antigen_names = additional_params.parse_antigen_names;
//                } else {
//                    input_parameter.data.parse_antigen_names = false;
//                }
//                break;
//            case 'get_table':
//                var input_parameter = {command: 'get_table', data: {}};
//                var file_name = this.extract_name(input_file);
//                file_name = file_name + '_' + DATE_NOW + ".json";
//                break;
//            case 'get_map':
//                var input_parameter = {command: 'get_map', data: {projection: 0}};
//                if (additional_params.hasOwnProperty('projection')) {
//                    var projection = additional_params.projection;
//                    var input_parameter = {command: 'get_map', data: {projection: projection}};
//                }
//                input_parameter.data.error_lines = true;
//                input_parameter.data.blob_stress_diff = 0.1;
//                input_parameter.data.blob_number_of_directions = 36;
//                input_parameter.data.blobs = true;
//
//                if (additional_params.hasOwnProperty('error_lines')) {
//                    input_parameter.data.error_lines = additional_params.error_lines;
//                }
//                if (additional_params.hasOwnProperty('blob_stress_diff')) {
//                    input_parameter.data.blob_stress_diff = additional_params.blob_stress_diff;
//                }
//                if (additional_params.hasOwnProperty('blob_number_of_directions')) {
//                    input_parameter.data.blob_number_of_directions = additional_params.blob_number_of_directions;
//                }
//                if (additional_params.hasOwnProperty('blobs')) {
//                    input_parameter.data.blobs = additional_params.blobs;
//                }
//
//                var file_name = this.extract_name(input_file);
//                var random_number = Math.random() * 89;
//                file_name = file_name + '_' + DATE_NOW + random_number + ".json";
//                break;
//            default :
//                break;
//        }
//        var json_parameters = JSON.stringify(input_parameter, null, 4);
//        var file_path = store_path + file_name;
//        fs.writeFile(file_path, json_parameters, function (err) {
//            if (err) {
//                throw err;
//            }
//        });
//
//        return file_path;
//    },
//    /**
//     * first step of the api call, import user data and return acd1 file (used for further processing)
//     *
//     * @param input_file
//     * @param task
//     * @param additional_params
//     * @returns {{output_acd1: *, table_json: *, map_json: *}}
//     */
//    import_user_data: function (input_file, task, additional_params) {
//        var command = "import";
//        // @todo get parameters name ,and parse_antigen_names (boolean) from user
//        //var additional_params = {name: 'test_file', parse_antigen_names: true};
//        //var additional_params = {};
//        var store_path = config.store.temp;
//        // create and fetch input_parameter file
//        var input_param_file = this.create_input_parameter(command, additional_params, input_file);
//
//        // callback function for exec
//        function puts(error, stdout, stderr) {
//            if (error) {
//                // @todo handle error/exception properly
//                //this.emit('error', error);
//                console.log(error);
//            } else if (task === 'new-open') {
//                var api = require('./api.js');
//                var output_table_json = api.get_table_data(input_file, output_acd1);
//                var output_map_json = api.get_map(input_file, output_acd1);
//            }
//            //sys.puts(stdout);
//        }
//
//        var script = config.api.script;
//        var data_path = config.store.path;
//        var output_json = this.create_file_path(data_path, input_file, '.json', '');
//        var output_acd1 = this.create_file_path(data_path, input_file, '.acd1', '');
//        var command = script + input_param_file + " " + input_file + " " + output_json + " " + output_acd1;
//        // callback function for exec
//        try {
//            exec(command, puts);
//        } catch (Error) {
//            console.log(Error.message);
//        }
//        var output_table_json = this.create_file_path(data_path, input_file, '.json', 'table');
//        var output_map_json = this.create_file_path(data_path, input_file, '.json', 'map');
//        var output = {
//            "output_acd1": output_acd1,
//            "table_json": output_table_json,
//            "map_json": output_map_json,
//        }
//        return output;
//    },
//    get_table_data: function (input_file, output_acd1) {
//        var command = "get_table";
//        // @todo get data params from user (question: what data parameters are supported)
//        var additional_params = {};
//        // create and fetch input_parameter file
//        var input_param_file = this.create_input_parameter(command, additional_params, input_file);
//        // callback function for exec
//        function puts(error, stdout, stderr) {
//            if (error) {
//                // @todo handle error/exception properly
//                //this.emit('error', error);
//                console.log(error);
//            }
//        }
//
//        var script = config.api.script;
//        var data_path = config.store.path;
//        var output_json = this.create_file_path(data_path, input_file, '.json', 'table');
//        var command = script + input_param_file + " " + output_acd1 + " " + output_json;
//        try {
//            exec(command, puts);
//        } catch (Error) {
//            console.log('get_table - ' + Error.message);
//        }
//        return output_json;
//    },
//    get_map: function (input_file, output_acd1) {
//        var command = "get_map";
//        // @todo get data params from user (question: what data parameters are supported)
//        var additional_params = {};
//        // create and fetch input_parameter file
//        var input_param_file = this.create_input_parameter(command, additional_params, input_file);
//        // callback function for exec
//        function puts(error, stdout, stderr) {
//            if (error) {
//                // @todo handle error/exception properly
//                //this.emit('error', error);
//                console.log(error);
//            }
//            //sys.puts(stdout);
//        }
//
//        var script = config.api.script;
//        var data_path = config.store.path;
//        var output_json = this.create_file_path(data_path, input_file, '.json', 'map');
//        var command = script + input_param_file + " " + output_acd1 + " " + output_json;
//        //console.log(command);
//        try {
//            exec(command, puts);
//        } catch (Error) {
//            console.log(Error.message);
//        }
//        return output_json;
//    },
//    relax_map: function () {
//        var command = "relax";
//    },
//    make_new_projection: function () {
//        var command = "make_new_projection_and_relax";
//    },
//    create_file_path: function (path, file_name, extension, extra) {
//        var file = file_name.split('/').pop();
//        var date_now = DATE_NOW;
//        if (extra.length <= 0) {
//            var output = path + file.substr(0, file.lastIndexOf(".")) + '_' + date_now + extension;
//        } else {
//            var output = path + file.substr(0, file.lastIndexOf(".")) + '_' + extra + '_' + date_now + extension;
//        }
//
//        return output;
//    },
//    extract_name: function (file_name) {
//        var file = file_name.split('/').pop();
//        var output = file.substr(0, file.lastIndexOf("."));
//        return output;
//    },
//    date_now: function () {
//        // maintain single instance of date through out the request
//        return DATE_NOW;
//    },
//    stub: function () {
//        var output = {
//            "output_acd1": 'output_EU.acd1',
//            "table_json": './test/data/get_table_concentric.json',
//            "map_json": './test/data/get_map.json',
//        }
//        return output;
//    }
//
//}

/**
 * code below is commented for future reference (adding it as angular module)
 */


