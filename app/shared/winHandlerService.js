(function() {
    'use strict';

    angular
        .module('acjim')
        .service('winHandler', winHandler);

    function winHandler() {

        var openWindows = [];
        var newMapCounter = 1;

        var service = {
            addWindow: addWindow,
            addEmptyWindow: addEmptyWindow,
            getOpenWindows: getOpenWindows
        };

        return service;

        ////////////////

        /**
         * Add a window to the openWindows array
         * @param options = {table: tableData, map: mapData}
         */
        function addWindow(options) {

            var windowTitle = options.table ? options.table.info.name : 'New Table ' + newMapCounter++;

            openWindows.push({
                table: options.table || null,
                map: options.map || { map: null },
                options: {
                    x: 0,
                    y: 0,
                    width: 600,
                    height:500,
                    title: windowTitle,
                    onClose: function() {
                        var index = openWindows.indexOf(this);
                        openWindows.splice(index, 1);
                    }
                }
            });

        }


        /**
         * Adds an empty window to the window stack
         */
        function addEmptyWindow() {

            addWindow({});

        }

        /**
         * Returns array with all open windows
         * @returns {Array}
         */
        function getOpenWindows() {
            return openWindows;
        }

    }

})();
