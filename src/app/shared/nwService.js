(function() {
    'use strict';

    angular.module('acjim')
        .service('nwService', ['$rootScope', '$timeout', function($rootScope, $timeout)  {

            var gui = require("nw.gui"),
                window = gui.Window.get(),
                parentId = 1,
                parentWindow = global.__nwWindowsStore[parentId];

            // send a message to the parent window whenever the focus changes
            window.on('focus', function() {
                parentWindow.emit("active-window-changed", window.id);
            });

            // will be called when a menu item is clicked
            window.on('menu-action', function (eventName) {
                $timeout($rootScope.$broadcast(eventName));
            });

            window.show();
            window.focus();

            return {
                gui: gui,
                window: window,
                parentWindow: parentWindow
            };
    }]);
})();
