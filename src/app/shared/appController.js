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

angular.module('acjim').controller('appCtrl', ['$scope', 'nwService', function($scope, nwService) {

    // Open Debug Window
    $scope.$on('open-debug', function() {
        nwService.gui.Window.get().showDevTools();
    });

    // Reload
    $scope.$on('reload-app', function() {
        if (location) {
            location.reload();
        }
    });

    //Close app
    $scope.$on('exit-app', function() {
        nwService.gui.Window.get().close();
    });

    // Load native UI library
    var gui = require('nw.gui'); //or global.window.nwDispatcher.requireNwGui() (see https://github.com/rogerwang/node-webkit/issues/707)

    // Get the current window
    var win = gui.Window.get();

    win.on('close', function () {
        this.hide(); // Pretend to be closed already
        var store_path = config.store.path;
        console.log("Closing and removing generated files...");
        $scope.rmDir(store_path);
        this.close(true);
    });

    $scope.rmDir = function(dirPath) {
        try { var files = fs.readdirSync(dirPath); }
        catch(e) { return; }
        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if(files[i] !== '.gitkeep') {
                    if (fs.statSync(filePath).isFile())
                        fs.unlinkSync(filePath);
                    else
                        this.rmDir(filePath);
                }
            }
        }
    };

}]);
