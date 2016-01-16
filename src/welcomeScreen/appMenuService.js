(function() {
    'use strict';

    angular.module('acjim.appMenu', [])
        .factory('appMenuService', ['nwService', '$rootScope', appMenuService]);

    function appMenuService(nwService, $rootScope) {

        var gui = nwService.gui,
            win = nwService.window,
            __activeWindowId = null;

        // react on child window changes
        win.on('active-window-changed', function (id) {
            __activeWindowId = id;
        });

        var osModifier = process.platform === 'darwin' ? 'cmd' : 'ctrl';

        var standardMenu = {
            root: {
                type: 'menubar',
                items: [
                    {
                        label: 'File',
                        items: [
                        {label: 'New...', tooltip: 'Create a new file', click: 'new-file', modifiers: osModifier, key: 'n', enabled: false},
                        {label: 'Open...', tooltip: 'Open a file', click: 'open-file', modifiers: osModifier, key: 'o'},
                        {label: 'Close Window', tooltip: 'Close Window', click: 'close-window', modifiers: osModifier, key: 'w'},
                        //{label: 'Close All', tooltip: 'Close all currently open files', click: 'close-all', modifiers: osModifier + 'shift', key: 'w' },
                        {type: 'separator'},
                        {label: 'Save', tooltip: 'Save a file', click: 'save-file', modifiers: osModifier, key: 's', enabled: true},
                        {
                            label: 'Export file as...',
                            tooltip: 'Export file as...',
                            click: 'save-as',
                            modifiers: osModifier + 'shift',
                            key: 's',
                            enabled: true
                        },
                        {type: 'separator'},
                        {label: 'Exit Application', tooltip: 'Quit Application', click: 'exit-app'}
                    ]
                    },
                    {
                        label: 'Edit', items: [
                        {label: 'Undo', click: 'undo', modifiers: osModifier, key: 'z'},
                        {label: 'Redo', click: 'redo', modifiers: osModifier + 'shift', key: 'z'},
                        {type: 'separator'},
                        {label: 'Cut', click: 'cut', modifiers: osModifier, key: 'x'},
                        {label: 'Copy', click: 'copy', modifiers: osModifier, key: 'c'},
                        {label: 'Paste', click: 'paste', modifiers: osModifier, key: 'v'},
                        {type: 'separator'},
                        {label: 'Find', click: 'find', modifiers: osModifier, key: 'f'},
                        {label: 'Replace', click: 'find-replace', modifiers: osModifier + 'alt', key: 'z'}
                    ]
                    },
                    {
                        label: 'Map', items: [
                        {label: 'Optimize', click: 'map.reOptimize', modifiers: osModifier + 'alt', key: 'o'},
                        {type: 'separator'},
                        {
                            label: 'Zoom', items: [
                            {label: 'Zoom In', click: 'map.zoomIn', modifiers: osModifier, key: '+'},
                            {label: 'Zoom Out', click: 'map.zoomOut', modifiers: osModifier, key: '-'},
                            {type: 'separator'},
                            {label: 'Normal Zoom', click: 'map.zoomInitial', modifiers: osModifier, key: '0'}
                        ]},
                        {
                            label: 'Tools', items: [
                            {label: 'Selection Tool', click: 'map.selectionTool', modifiers: osModifier + 'alt', key: 'v'},
                            {label: 'Movement Tool', click: 'map.movementTool', modifiers: osModifier + 'alt', key: 'm'}
                        ]},
                        {type: 'separator'},
                        {label: 'Toggle Error Lines', click: 'map.showErrorLines'},
                        {label: 'Toggle Connection Lines', click: 'map.showConnectionLines'},
                        {label: 'Toggle Labels', click: 'map.showLabels'}
                    ]
                    },
                    {
                        label: 'View', items: [
                        {label: 'Toggle Toolbar', click: 'layout.toolbar'},
                        {label: 'Toggle Table', click: 'layout.table'},
                        {type: 'separator'}
                    ]
                    },
                    {
                        label: 'Debug', items: [
                        {label: 'Show Developer Tools', click: 'open-debug', modifiers: osModifier + 'alt', key: 'i'},
                        {label: 'Reload Application', click: 'reload-app', modifiers: osModifier, key: 'r'}
                    ]
                    }
                ]
            }
        };

        return {
            setMinimalMenu: setMinimalMenu,
            createNormalMenu: createNormalMenu
        };

        ///////////////////////

        function setMinimalMenu() {

            createMenu({
                root: {
                    type: 'menubar'
                }
            });

        }


        function createNormalMenu() {
            createMenu(standardMenu);
        }


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

                        };
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