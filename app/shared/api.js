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

var sys = require('sys');
var config = require('./config.js');
var exec = require('child_process').exec;

angular.module('acjim.api', [])
    .factory('api', [function () {
        var api = {};
        api.createMapFile = function (file_path) {


            var env_variable = 'ACMACS_ROOT';
            var env = process.env[env_variable];
            //@todo get env_variable working
            var env = "/Users/rohan/Documents/workspace/acmacs_core/acmacs";

            // extract file_name from file_path parameter
            var file = file_path.split('/').pop();
            var file_name = file.substr(0, file.lastIndexOf(".")) + '_'+ Date.now() +  ".json";

            // store_path is the path where the files are stored inside the system, configured in config.js
            var store_path = config.store.path;
            // script to be called
            var script = "im";

            function puts(error, stdout, stderr) {
                if (error) {
                    return console.log(error);
                }
                sys.puts(stdout);
            }

            //var command = env + "/bin/c2env " + script + " " + file_path + " " + store_path + file_name;
            //exec(command, puts);

            return store_path+file_name;
        };

        api.convertFile = function () {

        };

        return api;
    }]);


