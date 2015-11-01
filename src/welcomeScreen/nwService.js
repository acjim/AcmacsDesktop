(function() {
    'use strict';

    angular.module('AcmacsDesktop')
        .factory('nwService', ['$rootScope', nwService]);

    function nwService($rootScope) {

        // Load native UI library
        var gui = require('nw.gui'),
            win = gui.Window.get(),
            __activeWindowId = null;

        // react on child window changes
        win.on('active-window-changed', function (id) {
            __activeWindowId = id;
        });

        return {
            gui: gui,
            window: win,
            createMenu: createMenu
        };

        ////////////////////


        function getActiveWindow() {
            return global.__nwWindowsStore[__activeWindowId];
        }


        function createMenu(menuStructure) {

            // Create the top menu
            var menu = new gui.Menu(menuStructure.root);

            if (process.platform === 'darwin') {
                menu.createMacBuiltin('Acmacs Desktop', { // can hide edit/window menu by setting below to true
                    hideEdit: true,
                    hideWindow: true
                });
            }

            // Create sub-menu items if they're provided
            if (menuStructure.root && menuStructure.root.items) {
                createMenuItems(menu, menuStructure.root.items);
            }

            if (menu.type === 'menubar') {
                win.menu = menu;
            }

            return menu;
        }

        function createMenuItems(menu, items) {

            _.each(items, function (i) {

                // Shortcut to integrate menu with Angular event system when click represents an eventName
                if (_.isString(i.click)) {

                    i.click = (function (menu, eventName) {
                        return function () {

                            var nwWindow = getActiveWindow();

                            // If no window is open, broadcast events in splash screen
                            if (!nwWindow) {
                                $rootScope.$broadcast(eventName);
                                return;
                            }

                            nwWindow.emit("menu-action", eventName);

                        }
                    })(menu, i.click);

                }

                // Create a sub-menu if items are provided
                if (i.items) {
                    i.submenu = new gui.Menu();
                    createMenuItems(i.submenu, i.items);
                }

                // Append the menu item to the provided menu
                menu.append(new gui.MenuItem(i));
            });

        }

    }
})();