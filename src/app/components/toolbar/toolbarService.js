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

    angular.module('acjim.toolbar')
        .factory('toolbar', [toolbar]);

    function toolbar () {

        var items = [],
            groups = [];

        var service = {
            init: init,
            getAllItems: getAllItems,
            getActiveItemFromGroup: getActiveItemFromGroup
        };

        return service;

        ///////////////////


        /**
         * Initializes the toolbar
         * @param options Array of options
         */
        function init(options) {
            items = loopItems(options);
        }

        /**
         * Loops through each item of the given options array, returns an items array
         * @param options
         * @returns {Array}
         */
        function loopItems(options) {

            var items = [];

            for (var i = 0; i < options.length; i++) {
                items.push(constructItem(options[i]));
            }

            return items;

        }

        /**
         * Constructs the item from the given options object. If the item has a group id, adds the item to that group.
         * @param options
         * @returns {{id: (*|null), order: (*|boolean|Number), caption: (*|string|string|string|HTMLTableCaptionElement|null), type: (*|string), buttons: *, icon: (*|string|string|string|null), active: (*|boolean), groupID: (*|null), click: Function, select: Function, isButtonGroup: Function}}
         */
        function constructItem(options) {

            var toolbarItem = {
                id: options.id || null,
                order: options.order || items.length,
                icon: options.icon || null,
                caption: options.caption || null,
                type: options.type || 'button',
                buttons: options.buttons ? loopItems(options.buttons) : null,
                active: options.active || false,
                togglable: options.togglable || false,
                groupID: options.groupID || null,
                click: function() {

                    if (this.groupID != null && groups[this.groupID]) {
                        groupSelectItem(this.groupID, this);
                    };

                    if (this.togglable) {
                        this.toggle();
                    }

                    if (options.callback != null) {
                        options.callback();
                    }

                },
                select: function(selected) {
                    this.active = selected;
                },
                isButtonGroup: function() {
                    return this.type == 'buttonGroup'
                },
                toggle: function() {
                    this.select(!this.active);
                }
            };

            // If group id is provided, add item to that group
            if (toolbarItem.groupID) {
                addItemToGroup(toolbarItem, toolbarItem.groupID);
            }

            return toolbarItem;

        }


        /**
         * Selects the given item in the group provided in the parameter
         * @param groupID
         * @param item
         */
        function groupSelectItem(groupID, item) {

            var group = groups[groupID];

            for (var i = 0; i < group.length; i ++) {
                group[i].select(false);
            }

            item.select(true);

        }


        /**
         * Adds the item to the given group.
         * @param item
         * @param groupID
         */
        function addItemToGroup (item, groupID) {
            var group;

            if (!groups[groupID]) {
                group = groups[groupID] = [];
            } else {
                group = groups[groupID];
            }

            group.push(item);
        }


        /**
         * Returns an array of all toolbar items.
         * @returns {Array}
         */
        function getAllItems() {
            return items;
        }


        /**
         * Searches for the active item of a given group. Returns the first active item it finds. If no active item is
         * found, returns undefined.
         * @param groupID
         * @returns {*}
         */
        function getActiveItemFromGroup(groupID) {

            var activeItem = _.find(groups[groupID], function(item) { return item.active == true; });

            if (!activeItem) {
                return { id: -1 };
            } else {
                return activeItem;
            }

        }


        /**
         * Gets the item with the specified ID from the items array
         * @param itemID
         * @returns {*} item object if found or undefined, if not found
         */
        function getItem(itemID) {
            return _.find(items, function(item) { return item.id == itemID; });
        }

    }

})();
