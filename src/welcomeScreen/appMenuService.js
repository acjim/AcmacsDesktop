(function() {
    'use strict';

    angular.module('acjim.appMenu', [])
        .factory('appMenuService', ['nwService', appMenuService]);

    function appMenuService(nwService) {

        var osModifier = process.platform === 'darwin' ? 'cmd' : 'ctrl';

        var standardMenu = {
            root: {
                type: 'menubar',
                items: [
                    {
                        label: 'File',
                        items: [
                        {
                            label: 'New...',
                            tooltip: 'Create a new file',
                            click: 'new-file',
                            modifiers: osModifier,
                            key: 'n'
                        },
                        {label: 'Open...', tooltip: 'Open a file', click: 'open-file', modifiers: osModifier, key: 'o'},
                        {label: 'Close', tooltip: 'Close a file', click: 'close-file', modifiers: osModifier, key: 'w'},
                        {
                            label: 'Close All',
                            tooltip: 'Close all currently open files',
                            click: 'close-all',
                            modifiers: osModifier + 'shift',
                            key: 'w'
                        },
                        {type: 'separator'},
                        {label: 'Save', tooltip: 'Save a file', click: 'save-file', modifiers: osModifier, key: 's'},
                        {
                            label: 'Save All',
                            tooltip: 'Save all files',
                            click: 'save-all',
                            modifiers: osModifier + 'alt',
                            key: 's'
                        },
                        {
                            label: 'Save As...',
                            tooltip: 'Save file as...',
                            click: 'save-as',
                            modifiers: osModifier + 'shift',
                            key: 's'
                        },
                        {label: 'Exit', tooltip: 'Quit Application', click: 'exit-app'} //TODO: See broadcast exit-app
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
                        label: 'Backend', items: [
                        {label: 'Reoptimization Map', click: 'api.reoptimize', modifiers: osModifier + 'alt', key: 'r'},
                        {label: 'Show Error Lines', click: 'api.geterrorlines'},
                        {label: 'Show Connection Lines', click: 'api.getconnectionlines'}
                    ]
                    },
                    {
                        label: 'Debug', items: [
                        {label: 'Show Developer Tools', click: 'open-debug', modifiers: osModifier + 'alt', key: 'i'},
                        {label: 'Reload Application', click: 'reload-app', key: 'r'}
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

            nwService.createMenu({
                root: {
                    type: 'menubar'
                }
            });

        }


        function createNormalMenu() {

            nwService.createMenu(standardMenu);

        }


    }

})();