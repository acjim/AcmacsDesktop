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

// Declare app level module which depends on views, and components
var app = angular.module('acjim', [
    'ngRoute',
    'ui.bootstrap',
    'ui.layout',
    'acjim.fileHandling',
    'acjim.api',
    'acjim.map',
    'acjim.table',
    'acjim.toolbar',
    'acjim.appMenu',
    'ngHtmlWindow',
    'angular-loading-bar',
    'ngAnimate',
    'DWand.nw-fileDialog'
]);

angular.module('acjim.toolbar', []);

app.run(function($rootScope, toolbar, toolbarItems, appMenuService) {

    if (process.platform !== "darwin") {
        appMenuService.createNormalMenu();
    }

    //Create the toolbar
    toolbar.init([
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.SELECTION,
                    caption: 'Selection',
                    active: true,
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'glyphicon glyphicon-unchecked',
                    callback: function () {
                        $rootScope.$emit('tool.selected');
                    }
                },
                {
                    id: toolbarItems.MOVEMENT,
                    caption: 'Movement',
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'glyphicon glyphicon-move',
                    callback: function () {
                        $rootScope.$emit('tool.selected');
                    }
                }
            ]
        },
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.SHOW_ERROR_LINES,
                    caption: 'Show Error Lines',
                    icon: 'glyphicon glyphicon-transfer',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('api.geterrorlines');
                    }
                },
                {
                    id: toolbarItems.SHOW_CONNECTION_LINES,
                    caption: 'Show Connection Lines',
                    icon: 'glyphicon glyphicon glyphicon-road',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('api.getconnectionlines');
                    }
                }
            ]
        },
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.RE_OPTIMIZE,
                    caption: 'Reoptimize',
                    icon: 'glyphicon glyphicon-refresh',
                    callback: function () {
                        $rootScope.$broadcast('api.reoptimize');
                    }
                },
                {
                    id: toolbarItems.UPDATE_TABLE,
                    caption: 'Update Table',
                    icon: 'glyphicon glyphicon-list-alt',
                    callback: function () {
                        $rootScope.$broadcast('api.updateTable');
                    }
                }
            ]
        },

    ]);

});
