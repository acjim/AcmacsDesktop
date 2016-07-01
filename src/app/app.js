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
    'dialogs.main',
    'acjim.fileHandling',
    'acjim.api',
    'acjim.map',
    'acjim.table',
    'acjim.toolbar',
    'acjim.appMenu',
    'angular-loading-bar',
    'ngAnimate',
    'DWand.nw-fileDialog'
]);

app.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

app.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
    cfpLoadingBarProvider.latencyThreshold = 5000;     // never start loading bar automatically
}]);

app.run(function ($rootScope, toolbar, toolbarItems, appMenuService) {

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
                    caption: 'Selection Tool',
                    active: true,
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'icon acmacs-select',
                    callback: function () {
                        $rootScope.$emit('tool.selected');
                    }
                },
                {
                    id: toolbarItems.MOVEMENT,
                    caption: 'Movement Tool',
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'icon acmacs-move',
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
                    id: toolbarItems.ZOOM_IN,
                    caption: 'Zoom In',
                    icon: 'icon acmacs-zoom-in',
                    togglable: false,
                    callback: function () {
                        $rootScope.$emit('map.zoomIn');
                    }
                },
                {
                    id: toolbarItems.ZOOM_OUT,
                    caption: 'Zoom Out',
                    icon: 'icon acmacs-zoom-out',
                    togglable: false,
                    callback: function () {
                        $rootScope.$emit('map.zoomOut');
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
                    icon: 'icon acmacs-error-line',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('map.showErrorLines', this.id);
                    }
                },
                {
                    id: toolbarItems.SHOW_CONNECTION_LINES,
                    caption: 'Show Connection Lines',
                    icon: 'icon acmacs-connection',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('map.showConnectionLines', this.id);
                    }
                }
            ]
        },
        {
            id: toolbarItems.SHOW_LABELS,
            caption: 'Show Node Labels',
            icon: 'icon acmacs-label',
            togglable: true,
            callback: function () {
                $rootScope.$emit('map.showLabels', this.id);
            }
        },
        {
            id: toolbarItems.RE_OPTIMIZE,
            caption: 'Optimize Map',
            icon: 'icon acmacs-optimize',
            callback: function () {
                $rootScope.$broadcast('map.reOptimize');
            }
        },
        {
            id: toolbarItems.RANDOMIZE_NODES,
            caption: 'Randomize Nodes',
            icon: 'icon acmacs-random',
            callback: function () {
                $rootScope.$broadcast('map.randomize');
            }
        },
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.FIX_NODES,
                    caption: 'Fix Selected Nodes',
                    icon: 'icon acmacs-fix',
                    callback: function () {
                        $rootScope.$broadcast('api.set_unmovable_points');
                    }
                },
                {
                    id: toolbarItems.DISCONNECT_NODES,
                    caption: 'Disconnect Selected Nodes',
                    icon: 'icon acmacs-disconnect',
                    callback: function () {
                        $rootScope.$broadcast('api.set_disconnected_points');
                    }
                }
            ]
        },
        {
            id: toolbarItems.NEW_MAP_FROM_SELECTED,
            caption: 'Create New Map From Selected Elements',
            icon: 'icon acmacs-windows',
            callback: function () {
                $rootScope.$broadcast('map.create_from_selected');
            }
        }, {
            id: toolbarItems.FLIP_MAP_LEFT,
            caption: 'FLIP MAP',
            icon: 'icon acmacs-windows',
            callback: function () {
                $rootScope.$broadcast('map.flip_map_left');
            }
        }
    ]);

});
