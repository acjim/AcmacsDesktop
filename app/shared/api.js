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
var COMMANDS = {GET_MAP: 'get_map', GET_TABLE: 'get_table', RELAX: 'relax', NEW_PROJECTION: 'make_new_projection_and_relax'};

angular.module('acjim.api', [])
    .factory('api', ['$q', '$timeout', function ($q, $timeout) {
        var api = {};

        /**
         * creates json file with input parameters
         * for example: input.json - json object telling acmacs core api what to do
         *
         * @param command [import, get_table, get_map, relax, make_new_projection_and_relax]
         * @param additional_params [depends on command, check further documentation on each of command handling functions]
         * @param input_file [User input file]
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
                case 'relax':
                    break;
                case 'make_new_projection_and_relax':
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
         * Imports table or chart in one of the supported by acmacs format (txt, xls, acd1, etc.)
         * First step of the api call, import user data and return acd1 file (used for further processing)
         * additional_params = { name: str,
         *                      parse_antigen_names: bool (default: False)
         *                      };
         * @param input_file (any file format supported by acmacs api)
         * @param additional_params Object
         * @returns {*}
         */
        api.import_user_data = function (input_file, additional_params) {

            var deferred = $q.defer();
            var command = "import";
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
            return deferred.promise;
        };

        /**
         * Executes api commands, function supports commands defined in VAR commands
         * For each set of command, different parameters are supported
         *
         * ------------
         * command = 'get_map'
         * -> Obtains map data (coordinates, plot specification) file for the given output_acd1 and additional parameters provided
         * additional_params = {
         *                      name: 'name_for_map',
         *                      parse_antigen_names: false // default; boolean,
         *                      error_lines: bool (default: False),
         *                      blob_stress_diff: float (default: 0.1),
         *                      blob_number_of_directions: int (default: 36),
         *                      blobs: bool (default: False),
         *                      projection: int (default: 0)
         *                      };
         * -------------
         *
         * command = 'get_table'
         * Obtains table data (antigens, sera, titers) file for the given output_acd1 and additional parameters provided
         * additional_params = {};
         *
         * -------------
         *
         * @param command
         * @param output_acd1
         * @param additional_params
         * @returns {*} Name of the files generated in general
         */
        api.execute = function (command, additional_params, output_acd1) {

            var deferred = $q.defer();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    deferred.reject(error);
                }
                deferred.resolve(output_json); // return call
            }

            var script = config.api.script;
            var data_path = config.store.path;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var command = script + input_param_file + " " + output_acd1 + " " + output_json;
            try {
                exec(command, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        /**
         * Create file path
         *
         * @param path
         * @param file_name
         * @param extension
         * @param command
         * @returns {string}
         */
        api.create_file_path = function (path, file_name, extension, command) {
            var file = file_name.split('/').pop();
            var date_now = DATE_NOW;
            if (command.length <= 0) {
                var output = path + file.substr(0, file.lastIndexOf(".")) + '_' + date_now + extension;
            } else if(command === this.get_commands().GET_MAP) {
                var output = path + file.substr(0, file.lastIndexOf(".")) + '_map_' + date_now + extension;
            } else if(command === this.get_commands().GET_TABLE) {
                var output = path + file.substr(0, file.lastIndexOf(".")) + '_table_' + date_now + extension;
            }


            return output;
        };

        /**
         * Extract just the file_name from the file_name.extension
         *
         * @param file_name
         * @returns {string}
         */
        api.extract_name = function (file_name) {
            var file = file_name.split('/').pop();
            var output = file.substr(0, file.lastIndexOf("."));
            return output;
        };

        /**
         * maintain single instance of date through out the request
         *
         * @returns {number} Datestamp
         */
        api.date_now = function () {
            return DATE_NOW;
        };

        /**
         *
         * @returns {{GET_MAP: string, GET_TABLE: string, RELAX: string, NEW_PROJECTION: string}}
         */
        api.get_commands = function() {
            return COMMANDS;
        }

        /**
         * stub function to be called when on windows system
         *
         * @returns {{output_acd1: string, table_json: string, map_json: string}}
         */
        api.stub = function () {
            var output = {
                "output_acd1": 'output_EU.acd1',
                "table_json": './test/data/get_table_concentric.json',
                "map_json": './test/data/get_map.json',
            }
            return output;
        };

        /**
         *
         * @returns {*}
         */
        api.asyncTest = function() {
            var deferred = $q.defer();

            $timeout(function() {
                deferred.resolve(['Hello', 'world!']);
            }, 200);

            return deferred.promise;
        };

        return api;
    }]);



