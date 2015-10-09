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

(function() {
    'use strict';

angular
    .module('acjim')
    .controller('toolbarCtrl', ['$scope', '$rootScope', 'toolbar', 'toolbarItems', toolbarCtrl]);

    function toolbarCtrl($scope, $rootScope, toolbar, toolbarItems) {

        toolbar.init([
            {
                type: "buttonGroup",
                buttons: [
                    {
                        id: toolbarItems.SELECTION,
                        caption: 'Selection Tool',
                        active: true,
                        groupID: toolbarItems.MAP_TOOLS,
                        icon: 'glyphicon glyphicon-unchecked',
                        callback: function () {
                            $rootScope.$emit('tool.selected');
                        }
                    },
                    {
                        id: toolbarItems.MOVEMENT,
                        caption: 'Movement Tool',
                        groupID: toolbarItems.MAP_TOOLS,
                        icon: 'glyphicon glyphicon-move',
                        callback: function () {
                            $rootScope.$emit('tool.selected');
                        }
                    }
                ]
            },
            {
                id: 2,
                caption: 'Sample Button',
                icon: 'glyphicon glyphicon-heart',
                togglable: true
            },
            {
                id: 8,
                caption: 'Disable Nodes Button',
                icon: 'glyphicon glyphicon-option-vertical',
                togglable: false,
                callback: function () {
                    $rootScope.$emit('node.disable');
                }
            },
            {
                id: 9,
                caption: 'Create New Map From Existing Map',
                icon: 'glyphicon glyphicon-plus-sign',
                callback: function () {
                    $rootScope.$emit('newMap.create');
                }
            },
            {
                id: 6,
                caption: 'Reoptimize',
                icon: 'glyphicon glyphicon-refresh',
                callback: function () {
                    $rootScope.$emit('api.reoptimize');
                }
            }
        ]);

    }

})();