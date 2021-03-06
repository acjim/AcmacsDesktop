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
var execFileSync = require('child_process').execFileSync;
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
    REMOVE_PROJECTIONS: 'remove_projections',
    REMOVE_ANTIGENS_SERA: 'remove_antigens_sera'
};

angular.module('acjim.api', [])
    .factory('api', ['$q', '$timeout', function ($q, $timeout) {
        var api = {};
        var script = config.api.script;
        var gui = window.require('nw.gui');
        var win = gui.Window.get();
        var win_id = win.id;
        var store_path = config.store.path;
        var data_path = store_path + win_id + '/';
        var tmp_path = data_path + 'tmp/';

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
                    file_name = file_name + ID() + ".json";
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
                    if (additional_params.hasOwnProperty('comment')) {
                        input_parameter.data.comment = additional_params.comment;
                        input_parameter.data.comment = additional_params.comment;
                    }
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
                        data: {filename: 'NewChart', format: "acd1"}
                    };

                    if (!additional_params.hasOwnProperty('format') || !additional_params.hasOwnProperty('filename')) {
                        throw new Error('Missing mandatory data, please make sure your data has: format, and filename');
                    }
                    if (additional_params.hasOwnProperty('projection')) {
                        input_parameter.data.projection = additional_params.projection;
                    }
                    input_parameter.data.filename = additional_params.filename;
                    input_parameter.data.format = additional_params.format;
                    break;
                case COMMANDS.RELAX_EXISTING:
                    var input_parameter = {command: COMMANDS.RELAX_EXISTING, data: {projection: 0, record_intermediate_layouts: true}};

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
                    var input_parameter = {command: COMMANDS.SET_UNMOVABLE_POINTS, data: {projection: 0}};

                    if (!additional_params.hasOwnProperty('projection')) {
                        throw new Error('Missing mandatory parameter, projection');
                    }
                    input_parameter.data.projection = additional_params.projection;
                    if (additional_params.hasOwnProperty('unmovable')) {
                        input_parameter.data.unmovable = additional_params.unmovable;
                    }
                    break;
                case COMMANDS.REMOVE_PROJECTIONS:
                    var input_parameter = {command: command, data: {}};

                    if (!additional_params.hasOwnProperty('remove')) {
                        throw new Error('Missing mandatory parameter, "remove"');
                    }
                    input_parameter.data.remove = additional_params.remove;
                    if (additional_params.hasOwnProperty('keep')) {
                        input_parameter.data.keep = additional_params.keep;
                    }
                    break;
                case COMMANDS.REMOVE_ANTIGENS_SERA:
                    var input_parameter = {command: command, data: {}};

                    if (!additional_params.hasOwnProperty('sera')) {
                        throw new Error('Missing mandatory parameter, "sera"');
                    }
                    if (!additional_params.hasOwnProperty('antigens')) {
                        throw new Error('Missing mandatory parameter, "antigens"');
                    }
                    input_parameter.data.antigens = additional_params.antigens;
                    input_parameter.data.sera = additional_params.sera;
                    break;
                default :
                    break;
            }
            if (command !== COMMANDS.IMPORT) {
                file_name = command + ID() + ".json";
            }
            var json_parameters = JSON.stringify(input_parameter, null, 4);
            var file_path = tmp_path + file_name;
            fs.writeFileSync(file_path, json_parameters);

            return file_path;
        };

        var ID = function () {
            // Math.random should be unique because of its seeding algorithm.
            // Convert it to base 36 (numbers + letters), and grab the first 9 characters
            // after the decimal.
            return '_' + Math.random().toString(36).substr(2, 8);
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

            // callback function for exec
            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({input_file: input_file, output_acd1: output_acd1}); // return call
            }

            try {
                var deferred = $q.defer();
                var command = "import";
                this.make_dir();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, input_file);
                var output_json = this.create_file_path(data_path, input_file, '.json', COMMANDS.IMPORT);
                var output_acd1 = this.create_file_path(data_path, input_file, '.acd1', COMMANDS.IMPORT);
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = input_file;
                params[params.length] = output_json;
                params[params.length] = output_acd1;
                execFile(script, params, puts);
            } catch (Error) {

                deferred.reject(api.format_error_message(Error.message));
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

            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve(output_json); // return call
            }

            try {
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
                var output_json = this.create_file_path(data_path, output_acd1, '.json', command);
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', command);
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFile(script, params, puts);
            } catch (Error) {

                deferred.reject(api.format_error_message(Error.message));
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

            try {
                var command = COMMANDS.RELAX;
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', "RLX");
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', "RLX");
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFile(script, params, puts);
            } catch (Error) {

                deferred.reject(api.format_error_message(Error.message));
            }

            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({output_json: output_json, updated_acd1: output_acd1_1}); // return call
            }

            return deferred.promise;
        };

        /**
         * set_disconnected_points
         *
         * Sets disconnection attribute for the listed points.
         * Disconnected points are not touched by the optimization engine,
         * they are not moved and they do not contribute to stress.
         * If list is empty, all points are made connected (regular).
         * Passed list contains just point indices, first come antigens starting with 0,
         * then come sera, index of the first serum is equal to the number of antigens in the table.
         * @param additional_params = {  disconnected: list, projection: int }
         * @param output_acd1
         * @returns {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.set_disconnected_points = function (additional_params, output_acd1) {

            try {
                var command = COMMANDS.SET_DISCONNECTED_POINTS;
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', 'DSC');
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', 'DSC');
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFile(script, params, puts);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
            }

            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({output_json: output_json, updated_acd1: output_acd1_1}); // return call
            }

            return deferred.promise;
        };

        /**
         * set_unmovable_points
         * Sets unmovable attribute for the listed points. Unmovable points cannot be moved by
         * the optimization engine, their coordinates are fixed, but they do contribute to stress.
         * If list is empty, all points are made movable (regular). Passed list contains just point indices,
         * first come antigens starting with 0, then come sera, index of the first serum is equal to the number
         * of antigens in the table.
         * @param additional_params = {  unmovable: list, projection: int }
         * @param output_acd1
         * @returns {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.set_unmovable_points = function (additional_params, output_acd1) {

            try {
                var command = COMMANDS.SET_UNMOVABLE_POINTS;
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', 'UNM');
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', 'UNM');
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFile(script, params, puts);
            } catch (Error) {

                deferred.reject(api.format_error_message(Error.message));
            }

            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({output_json: output_json, updated_acd1: output_acd1_1}); // return call
            }

            return deferred.promise;
        };

        /**
         * set_unmovable_points synchronous call
         * Sets unmovable attribute for the listed points. Unmovable points cannot be moved by
         * the optimization engine, their coordinates are fixed, but they do contribute to stress.
         * If list is empty, all points are made movable (regular). Passed list contains just point indices,
         * first come antigens starting with 0, then come sera, index of the first serum is equal to the number
         * of antigens in the table.
         * @param additional_params = {  unmovable: list, projection: int }
         * @param output_acd1
         * @returns {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.set_unmovable_points_sync = function (additional_params, output_acd1) {

            try {
                var command = COMMANDS.SET_UNMOVABLE_POINTS;
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', 'UNM');
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', 'UNM');
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFileSync(script, params);
                return {output_json: output_json, updated_acd1: output_acd1_1};
            } catch (Error) {
                return api.format_error_message(Error.message);
            }
        };

        /**
         * command = 'relax_existing', usually followed by get_map
         *
         * @param additional_params = {
         *                      projection: int, //mandatory
         *                      record_intermediate_layouts: bool (default: Fals)
         *                      rough_optimization: bool (default: False)
         *                      };
         * Result object:
         *   'stress' - resulting stress
         */
        api.relax_existing = function (additional_params, output_acd1) {

            try {
                var command = COMMANDS.RELAX_EXISTING;
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', "RE");
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', "RE");
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                if (process.platform === "win32") { //win only needs 1 parameter (it's inside the vagrant ssh -c '<here>')
                    params[params.length - 1] += input_param_file + " " + output_acd1 + " " + output_json + " " + output_acd1;
                } else {
                    params[params.length] = input_param_file;
                    params[params.length] = output_acd1;
                    params[params.length] = output_json;
                    params[params.length] = output_acd1_1;
                }
                execFile(script, params, puts);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
            }

            function puts(error) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
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


            // callback function for exec
            function puts(error, stdout, stderr) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve(new_output_acd1);
            }

            try {
                var command = COMMANDS.UPDATE_TABLE;
                var deferred = $q.defer();
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
                var output_json = this.create_file_path(data_path, output_acd1, '.json', "UPT");
                var new_output_acd1 = this.create_file_path(data_path, output_acd1, '.acd1', "UPT");

                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = new_output_acd1;
                execFile(script, params, puts);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
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

            // callback function for execFile
            function result(error, stdout, stderr) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve(output_json);
            }

            try {
                var deferred = $q.defer();
                var command = COMMANDS.EXPORT;
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
                var output_json = this.create_file_path(data_path, output_acd1, '.json', "EXP");
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                execFile(script, params, result);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
            }
            return deferred.promise;
        };

        /**
         * command = make_new_projection
         * additional_params = {
         *                      coordinates: list //mandatory
         *                      projection: int //mandatory
         *                      comment: str //optional (default '')
         *               };
         *
         * @param additional_params
         * @param output_acd1
         * @returns {*} object with Name of the files generated : output_json and new_output_acd1
         */
        api.new_projection = function (additional_params, output_acd1) {

            // callback function for execFile
            function puts(error, stdout, stderr) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({output_json: output_json, output_acd1: new_output_acd1}); // return call
            }

            try {
                var command = COMMANDS.NEW_PROJECTION;
                var deferred = $q.defer();
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
                var output_json = this.create_file_path(data_path, output_acd1, '.json', "NP");
                var file = output_acd1.split('/').pop();
                file = file.substr(0, file.lastIndexOf("_"));
                var new_output_acd1 = this.create_file_path(data_path, file, '.acd1', "NP");
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = new_output_acd1;
                execFile(script, params, puts);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
            }
            return deferred.promise;
        };

        /**
         * Removes projection from the chart.
         * To keep some projections and remove the rest, specify projections to keep in "keep" and leave "remove" empty
         * additional_params = { remove: list //Mandatory data fields,
         * keep: list (default: []) //Optional data fields: }
         *
         * @param additional_params
         * @param output_acd1
         * @returns Object {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.remove_projections_sync = function(additional_params, output_acd1) {
            try {
                var command = COMMANDS.REMOVE_PROJECTIONS;
                // create and fetch input_parameter file
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);

                var output_json = this.create_file_path(data_path, output_acd1, '.json', 'RP');
                var output_acd1_1 = this.create_file_path(data_path, output_acd1, '.acd1', 'RP');
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = output_acd1_1;
                execFileSync(script, params);
                return output_acd1_1;
            } catch (Error) {
                return api.format_error_message(Error.message);
            }
        };

        /**
         * Removes Removes antigens and sera from the chart. "antigens" and "sera" are list of indexes starting from 0.
         *
         *  additional_params = { antigens: list //Mandatory data fields,
         *                        keep: sera (default: []) //Mandatory data fields: }
         *
         * @param additional_params
         * @param output_acd1
         * @returns Object {output_json: output_json, updated_acd1: output_acd1_1}
         */
        api.remove_antigens_sera = function (additional_params, output_acd1) {

            try {
                var command = COMMANDS.REMOVE_ANTIGENS_SERA;
                var deferred = $q.defer();
                var input_param_file = this.create_input_parameter(command, additional_params, output_acd1);
                var output_json = this.create_file_path(data_path, output_acd1, '.json', "RAS");
                var file = output_acd1.split('/').pop();
                file = file.substr(0, file.lastIndexOf("_"));
                var new_output_acd1 = this.create_file_path(data_path, file, '.acd1', "RAS");
                var params = _.compact(config.api.params); //copy the array, we don't want to modify the original
                params[params.length] = input_param_file;
                params[params.length] = output_acd1;
                params[params.length] = output_json;
                params[params.length] = new_output_acd1;
                execFile(script, params, callback);
            } catch (Error) {
                deferred.reject(api.format_error_message(Error.message));
            }

            function callback(error, stdout, stderr) {
                if (error) {
                    var error_message = api.get_error_message(output_json);
                    deferred.reject(error_message);
                }
                deferred.resolve({output_json: output_json, output_acd1: new_output_acd1});
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
            return path + command + ID() + extension;
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
         * Get the error message from the generated output file in case of errors
         *
         * @param output_file {String} Output_file name along with path
         * @returns {String}
         */
        api.get_error_message = function (output_file) {
            var output_raw = fs.readFileSync(output_file, 'utf8');
            var output_data = JSON.parse(output_raw);
            if (typeof output_data.errors[0] !== 'undefined') {
                //TODO: proper handling of error messages.
                var rx = /runtime_error:(.*)/g;
                var rx_1 = /RuntimeError:(.*)/g;
                var arr = rx.exec(output_data.errors[0]);
                var arr_1 = rx_1.exec(output_data.errors[0]);
                var warnMsg = output_data.errors[0];
                var index_rx = /IndexError:(.*)/g;
                var index_arr = index_rx.exec(output_data.errors[0]);
                if (_.isArray(arr) && arr[1]) {
                    warnMsg = arr[1];
                } else if(_.isArray(arr_1) && arr_1[1]) {
                    warnMsg = arr_1[1].replace("(forgot to check conformance?)", "");
                } else if(_.isArray(index_arr) && index_arr[1]) {
                    warnMsg = "This file is not compatible and cannot be opened";
                }
                console.warn(output_data.errors[0]);
                return "INFO " + warnMsg + "[acmacs-api, source: core-bundle]"
            }  else {
                return 'Error Occurred!';
            }
        }

        api.format_error_message = function (error) {
            return "INFO " + error + "[acmacs-api, source: web-api]";
        }

        api.get_data_path = function () {
            return data_path;
        }

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



