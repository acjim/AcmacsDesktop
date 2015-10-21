"use strict";

angular.module('acjim').service('nwService', ['$rootScope', function($rootScope)  {

    // Expose gui and main window
    var gui = this.gui = require("nw.gui");

    this.window = this.gui.Window.get();

    // Start application in maximized mode
    //this.window.maximize();
    this.window.show();
    this.window.focus();

    /**
     * Create a context or window menu.
     * @param menuStructure The actual structure of the menu. This is a shortcut to avoid calling all append methods after creation.
     * Just provide an object with the following supported properties:
     * {
         *  root:{
         *      type: "context|menubar",
         *      items:[{
         *          label: "My Menu Label",
         *          type: "normal|separator|checkbox",
         *          enabled: true|false,
         *          tooltip: "This is my tooltip",
         *          icon: "path-to-icon"
         *          items:[{recursive}]
         *      }]
         *  }
         * }
     * @returns {gui.Menu}
     */
    this.createMenu = function(menuStructure) {

        // Create the top menu
        var menu = new gui.Menu(menuStructure.root);

        if(process.platform=='darwin') {
            menu.createMacBuiltin('Acmacs Desktop', { // can hide edit/window menu by setting below to true
                hideEdit: true,
                hideWindow: true
            });
        }

        // Create sub-menu items if they're provided
        if(menuStructure.root && menuStructure.root.items) {
            createMenuItems(menu, menuStructure.root.items);
        }

        if(menu.type === 'menubar') {
            this.window.menu = menu;
        }

        return menu;
    };

    function createMenuItems(menu, items) {

        _.each(items, function(i) {

            // Shortcut to integrate menu with Angular event system when click represents an eventName
            if(_.isString(i.click)) {
                i.click = (function(menu, $rootScope, eventName) { return function() { $rootScope.$broadcast(eventName, menu, this) } })(menu, $rootScope, i.click);
            }

            // Create a sub-menu if items are provided
            if(i.items) {
                i.submenu = new gui.Menu();
                createMenuItems(i.submenu, i.items);
            }

            // Append the menu item to the provided menu
            menu.append(new gui.MenuItem(i));
        });

    }
}]);
