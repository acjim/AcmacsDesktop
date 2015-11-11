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

var config = require('./config.js');
var execFile = require('child_process').execFile;
var fs = require('fs');

var DATE_NOW = Date.now();
var COMMANDS = {
    IMPORT: 'import',
    GET_MAP: 'get_map',
    GET_TABLE: 'get_table',
    RELAX: 'relax',
    NEW_PROJECTION: 'make_new_projection',
    UPDATE_TABLE: 'update_table',
    ERROR_LINES: 'get_error_lines',
    EXPORT: 'export',
    RELAX_EXISTING: 'relax_existing',
    SET_DISCONNECTED_POINTS: 'set_disconnected_points',
    SET_UNMOVABLE_POINTS: 'set_unmovable_points',
};
var gui = window.require('nw.gui');
var win = gui.Window.get();
var win_id = win.id;
var store_path = config.store.path;
var data_path = store_path + win_id + '/';
var tmp_path = data_path + 'tmp/';

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
            switch (command) {
                case COMMANDS.IMPORT:
                    var file_name = 'input';
                    var input_parameter = {};
                    input_parameter.command = COMMANDS.IMPORT;
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
                case COMMANDS.GET_TABLE:
                    var input_parameter = {command: COMMANDS.GET_TABLE, data: {}};
                    break;
                case COMMANDS.GET_MAP:
                    var input_parameter = {command: COMMANDS.GET_MAP, data: {projection: 0}};
                    if (additional_params.hasOwnProperty('projection')) {
                        var projection = additional_params.projection;
                        var input_parameter = {command: 'get_map', data: {projection: projection}};
                    }

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

                    break;
                case COMMANDS.RELAX:
                    var input_parameter = {command: COMMANDS.RELAX, data: {number_of_dimensions: 2}};
                    if (additional_params.hasOwnProperty('number_of_dimensions')) {
                        var number_of_dimensions = additional_params.number_of_dimensions;
                        var input_parameter = {command: 'relax', data: {number_of_dimensions: number_of_dimensions}};
                    }
                    input_parameter.data.number_of_optimizations = 10; // default
                    if (additional_params.hasOwnProperty('number_of_optimizations')) {
                        input_parameter.data.number_of_optimizations = additional_params.number_of_optimizations;
                    }
                    if (additional_params.hasOwnProperty('best_map')) {
                        input_parameter.data.best_map = additional_params.best_map;
                    }
                    if (additional_params.hasOwnProperty('minimum_column_basis')) {
                        input_parameter.data.minimum_column_basis = additional_params.minimum_column_basis;
                    }
                    if (additional_params.hasOwnProperty('disconnect_having_few_titers')) {
                        input_parameter.data.disconnect_having_few_titers = additional_params.disconnect_having_few_titers;
                    }
                    if (additional_params.hasOwnProperty('rough_optimization')) {
                        input_parameter.data.rough_optimization = additional_params.rough_optimization;
                    }
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
                    break;
                case COMMANDS.NEW_PROJECTION:
                    var input_parameter = {command: COMMANDS.NEW_PROJECTION, data: {projection: 0}};
                    if (additional_params.hasOwnProperty('projection')) {
                        var projection = additional_params.projection;
                        var input_parameter = {command: COMMANDS.NEW_PROJECTION, data: {projection: projection}};
                    }

                    if (!additional_params.hasOwnProperty('coordinates')) {
                        throw new Error('Please pass coordinates');
                    }
                    input_parameter.data.coordinates = additional_params.coordinates;
                    break;
                case COMMANDS.UPDATE_TABLE:
                    var input_parameter = {command: COMMANDS.UPDATE_TABLE, data: {}};

                    if (!additional_params.hasOwnProperty('table') || !additional_params.hasOwnProperty('info') || !additional_params.hasOwnProperty('version')) {
                        throw new Error('Missing mandatory datas, please make sure your data has: table, info and version');
                    }
                    if (additional_params.hasOwnProperty('remove_existing_projections')) {
                        input_parameter.data.remove_existing_projections = additional_params.remove_existing_projections; // boolean
                    }
                    input_parameter.data = additional_params;
                    break;
                case COMMANDS.ERROR_LINES:
                    var input_parameter = {command: COMMANDS.ERROR_LINES, data: {}};

                    if (additional_params.hasOwnProperty('projection')) {
                        input_parameter.data.projection = additional_params.projection; // int
                    }
                    break;
                case COMMANDS.EXPORT:
                    var input_parameter = {
                        command: COMMANDS.EXPORT,
                        data: {filname: 'export_output', format: "acd1_v2.bz2"}
                    };

                    if (!additional_params.hasOwnProperty('format') || !additional_params.hasOwnProperty('filename')) {
                        throw new Error('Missing mandatory datas, please make sure your data has: format, and filename');
                    }
                    // TODO get path as input or parameter?
                    input_parameter.data.filename = config.store.path + aadditional_params.filename + "." + additional_params.format;
                    input_parameter.data.format = additional_params.format;
                    break;
                case COMMANDS.RELAX_EXISTING:
                    var input_parameter = {command: COMMANDS.RELAX_EXISTING, data: {projection: 0}};

                    if (!additional_params.hasOwnProperty('projection')) {
                        throw new Error('Missing mandatory parameter, projection');
                    }
                    input_parameter.data.projection = additional_params.projection;
                    if (additional_params.hasOwnProperty('rough_optimization')) {
                        input_parameter.data.rough_optimization = additional_params.rough_optimization;
                    }
                    break;
                case COMMANDS.SET_DISCONNECTED_POINTS:
                    var input_parameter = {command: COMMANDS.SET_DISCONNECTED_POINTS, data: {projection: 0}};

                    if (!additional_params.hasOwnProperty('projection')) {
                        throw new Error('Missing mandatory parameter, projection');
                    }
                    input_parameter.data.projection = additional_params.projection;
                    if (additional_params.hasOwnProperty('disconnected')) {
                        input_parameter.data.disconnected = additional_params.disconnected;
                    }
                    break;
                case COMMANDS.SET_UNMOVABLE_POINTS:
                    var input_parameter = {command: COMMANDS.RELAX_EXISTING, data: {projection: 0}};

                    if (!additional_params.hasOwnProperty('projection')) {
                        throw new Error('Missing mandatory parameter, projection');
                    }
                    input_parameter.data.projection = additional_params.projection;
                    if (additional_params.hasOwnProperty('unmovable')) {
                        input_parameter.data.unmovable = additional_params.unmovable;
                    }
                    break;
                default :
                    break;
            }
            if (command !== COMMANDS.IMPORT) {
                var file_name = this.extract_name(input_file);
                var random_number = Math.random() * 89;
                file_name = file_name + '_' + DATE_NOW + random_number + ".json";
            }
            var json_parameters = JSON.stringify(input_parameter, null, 4);
            var file_path = tmp_path + file_name;
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
            var script = config.api.script;
            this.make_dir();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, input_file);


            // callback function for exec
            function puts(error) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject('Importing file failed!');
                }
                deferred.resolve({input_file: input_file, output_acd1: output_acd1}); // return call
            }

            var output_json = this.create_file_path(data_path, input_file, '.json', COMMANDS.IMPORT);
            var output_acd1 = this.create_file_path(data_path, input_file, '.acd1', COMMANDS.IMPORT);
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = input_file;
            params[params.length] = output_json;
            params[params.length] = output_acd1;
            // callback function for exec
            try {
                execFile(script, params, puts);
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
         *                      name: 'name_for_map',  //mandatory
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
         * get_error_lines - Obtains error lines data for a projection
         * additional_params = {projection: int (default: 0) }
         * Result object:
         *      'error_lines' - for each antigen and serum list of opposite coordinates for each error line
         *
         * ------------------
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
            function puts(error) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                }
                deferred.resolve(output_json); // return call
            }

            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', command);
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = output_acd1;
            params[params.length] = output_json;
            params[params.length] = output_acd1_1;
            // callback function for exec
            try {
                execFile(script, params, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        /**
         * command = 'relax'
         *
         * @param additional_params = {
         *                      number_of_dimensions: int, //mandatory
         *                      number_of_optimizations: int, //mandatory
         *                      //Optional data fields:
         *                      error_lines: bool (default: False),
         *                      minimum_column_basis: str (default: 'none')
         *                      disconnect_having_few_titers: bool (default: True)
         *                      rough_optimization: bool (default: False)
         *                      best_map: bool (default: False)
         *                      blob_number_of_directions: int (default: 36)
         *                      blob_stress_diff: float (default: 0.1)
         *                      blobs: bool (default: False)
         *                      };
         * @param output_acd1
         * @returns {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.relax = function (additional_params, output_acd1) {

            var command = COMMANDS.RELAX;
            var deferred = $q.defer();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', command);
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = output_acd1;
            params[params.length] = output_json;
            params[params.length] = output_acd1_1;
            // callback function for exec
            try {
                execFile(script, params, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }

            function puts(error) {
                if (error) {
                    deferred.reject(error);
                }
                deferred.resolve({output_json: output_json, updated_acd1: output_acd1_1}); // return call
            }

            return deferred.promise;
        };

        /**
         * command = 'relax_existing', usually followed by get_map
         *
         * @param additional_params = {
         *                      projection: int, //mandatory
         *                      rough_optimization: bool (default: False)
         *                      };
         * Result object:
         *   'stress' - resulting stress
         */
        api.relax_existing = function (additional_params, output_acd1) {

            var command = COMMANDS.RELAX_EXISTING;
            var deferred = $q.defer();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', command);
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            if (process.platform === "win32") { //win only needs 1 parameter (it's inside the vagrant ssh -c '<here>')
                params[params.length - 1] += input_param_file + " " + output_acd1 + " " + output_json + " " + output_acd1;
            } else {
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
            }
            // callback function for exec
            try {
                execFile(script, params, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }

            function puts(error) {
                if (error) {
                    deferred.reject(error);
                }
                deferred.resolve({output_json: output_json, updated_acd1: output_acd1_1}); // return call
            }

            return deferred.promise;
        };

        /**
         * Updates table with changes supplied by the user.
         * Supplied data corresponds to the data obtained via get_table command.
         * Antigens/sera can be removed and new antigens/sera can be added.
         * Modifying titers, removing/adding antigens/sera is forbidden if chart has
         * projections and remove_existing_projections optional argument is false (default).
         *
         *   additional_params = {
         *      table: dict,
         *      version: int,
         *      info: dict,
         *      remove_existing_projections: bool (default: False) //Optional data field
         *   }
         *
         * @param additional_params
         * @param output_acd1
         * @returns {*} Name of the files generated in general
         */
        api.update_table = function (additional_params, output_acd1) {

            var command = COMMANDS.UPDATE_TABLE;
            var deferred = $q.defer();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // TODO handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                }
                deferred.resolve(new_output_acd1); // return call
            }

            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var new_output_acd1 = this.create_file_path(data_path, output_acd1, '.acd1', "upt");

            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = output_acd1;
            params[params.length] = output_json;
            params[params.length] = new_output_acd1;

            try {
                execFile(script, params, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        /**
         * export - Exports chart into one of the external formats.
         *
         * additional_params = { format: str,
         *                      file_name: str
         *                      };
         * @param output_acd1 acd1 file retrieved from import
         * @param additional_params Object
         * @returns {*}
         */
        api.export = function (output_acd1, additional_params) {

            var deferred = $q.defer();
            var command = COMMANDS.EXPORT;
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    console.log(error);
                    deferred.reject(error);
                }
            }

            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = output_acd1;
            params[params.length] = output_json;
            // callback function for exec
            try {
                execFile(script, params, puts);
            } catch (Error) {
                console.log(Error.message);
                deferred.reject(Error.message);
            }
            return deferred.promise;
        };

        /**
         * command = make_new_projection
         * additional_params = {
         *                      coordinates: list //mandatory
         *                      projection: int //mandatory
         *               };
         *
         * @param additional_params
         * @param output_acd1
         * @returns {*} object with Name of the files generated : output_json and new_outupt_acd1
         */
        api.new_projection = function (additional_params, output_acd1) {

            var command = COMMANDS.NEW_PROJECTION;
            var deferred = $q.defer();
            // create and fetch input_parameter file
            var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    // @todo handle error/exception properly
                    //this.emit('error', error);
                    console.log(error);
                    deferred.reject(error);
                }
                deferred.resolve({output_json: output_json, output_acd1: new_output_acd1}); // return call
            }

            var script = config.api.script;
            var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
            var file = output_acd1.split('/').pop();
            file = file.substr(0, file.lastIndexOf("_"));
            var new_output_acd1 = this.create_file_path(data_path, file, '.acd1', "up");
            var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
            params[params.length] = input_param_file;
            params[params.length] = output_acd1;
            params[params.length] = output_json;
            params[params.length] = new_output_acd1;
            try {
                execFile(script, params, puts);
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
            if (file.substr(0, file.lastIndexOf(".")).length > 0) {
                file = file.substr(0, file.lastIndexOf("."));
            }
            var date_now = DATE_NOW,
                output = null;

            // if filename already has command in it then simply add
            if (file.indexOf(command) > -1) {
                var randomnumber = Math.floor(Math.random() * (10)) + 1;
                output = path + file + '_' + randomnumber + extension;
                return output;
            }
            // remove import param from generated file
            if (command === COMMANDS.IMPORT) {
                output = path + file + '_' + date_now + extension;
            } else {
                output = path + file + '_' + command + '_' + date_now + extension;
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
        api.get_commands = function () {
            return COMMANDS;
        };

        /**
         * stub function to be called when on windows system
         *
         * @returns {{output_acd1: string, table_json: string, map_json: string}}
         */
        api.stubOpen = function () {
            var output = {
                "output_acd1": 'output_concentric.acd1',
                "table_json": '../test/data/output/get_table_concentric.json',
                "map_json": '../test/data/output/get_map.json'
            };
            return output;
        };

        /**
         *
         * @returns {*}
         */
        api.asyncTest = function () {
            var deferred = $q.defer();

            $timeout(function () {
                deferred.resolve(['Hello', 'world!']);
            }, 200);

            return deferred.promise;
        };

        api.make_dir = function () {
            if (!fs.existsSync(store_path)) {
                fs.mkdirSync(store_path, '0777');
            }
            if (!fs.existsSync(data_path)) {
                fs.mkdirSync(data_path, '0777');
            }
            if (!fs.existsSync(tmp_path)) {
                fs.mkdirSync(tmp_path, '0777');
            }
        };

        return api;
    }]);



