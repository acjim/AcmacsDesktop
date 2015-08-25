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
    $scope.$on('open-debug', function(e, menu, item) {
        nwService.gui.Window.get().showDevTools();
    });

    // Reload
    $scope.$on('reload-app', function(e, menu, item) {
        if (location)
            location.reload();
    });

    //Close app
    $scope.$on('exit-app', function(e, menu, item) {
        nwService.window.get().close();
    });

    $scope.win ={};
    $scope.win.newtitle = '';

    $scope.myfunction = function (){
//        console.log ('myfunction close');
    };

    $scope.options = {
        position: {x: 0, y:0},
        size: {width: 600, height:500},
        windowContainer: 'myMoveZone',
        maximizeTo: 'myMoveZone'

    };

}]);
