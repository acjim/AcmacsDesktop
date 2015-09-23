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

    angular.module('acjim')
        .factory('toolbar', [toolbar]);

    function toolbar () {

        var currentTool = null;

        var items = [];

        var service = {
            getCurrentTool: getCurrentTool,
            setCurrentTool: setCurrentTool,
            getItems: getItems,
            addGlobalScopeItem: addGlobalScopeItem
        };

        return service;

        ///////////////////

        /**
         * Adds a toolbar item that has a global effect, i.e. affects all of the opened maps. Only only one global scope
         * tool at a time can be activated. This is to be used for map manipulation tools like the move or the selection
         * tool.
         * @param id
         * @param caption
         * @param callback The callback handler of this item. Sets itself as the current tool
         */
        function addGlobalScopeItem(id, caption, icon, callback) { //, icon, tooltip, active, callbackFunction) {

            var toolbarItem = {
                id: id,
                caption: caption,
                icon: icon,
                active: false,
                click: function() {
                    setCurrentTool(this);
                    if (callback != null) {
                        callback();
                    }
                }
            };

            items.push(toolbarItem);
        }


        /**
         * Returns array of toolbar items
         * @returns {Array}
         */
        function getItems() {
            return items;
        }


        /**
         * Gets the current tool
         */
        function getCurrentTool() {
            return currentTool;
        }


        /**
         * Sets the current tool to the given toolbar item. Sets previous tools active state to false.
         * @param toolbarItem
         */
        function setCurrentTool(toolbarItem) {

            if (currentTool != null)
                currentTool.active = false

            currentTool = toolbarItem;
            currentTool.active = true;

        }

    }

})();
