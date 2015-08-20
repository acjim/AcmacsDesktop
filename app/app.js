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
    'DWand.nw-fileDialog',
    'acjim.filehandling',
    'acjim.map',
    'acjim.table',
    'acjim.app',
    'ngWindowManager',
    'bgDirectives'
]);

//app.factory('fileDialog', require('./app/components/filehandling/fileDialog.js')); //TODO: Fixme? Current this is a src include in the index.html
//app.factory('mapService', require('./app/shared/mapService.js'));
app.filter('nl2br', require('./app/shared/nl2br.js'));

//app.controller('tableCtrl', ['$scope', '$http', 'mapService', require('./app/components/table/tableController.js')]);
//app.controller('mapCtrl', ['$scope', '$http', 'mapService', require('./app/components/map/mapController.js')]);
//app.controller('filehandlingCtrl', ['$scope', '$http', 'mapService', 'fileDialog', require('./app/components/filehandling/filehandlingController.js')]);

/*app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/table', {
            templateUrl: 'app/components/table/tableView.html',
            controller: 'tableCtrl'
    });

    $routeProvider.when('/map', {
        templateUrl: 'app/components/map/mapView.html',
        controller: 'mapCtrl'
    });

    $routeProvider.when('/filehandling', {
        templateUrl: 'app/components/filehandling/filehandlingView.html',
        controller: 'filehandlingCtrl'
    });

    $routeProvider.otherwise({redirectTo: '/'});
}]);*/


app.service('nwService', ['$rootScope', '$q', function($rootScope, $q)  {

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

app.run(function(nwService, $rootScope) {

    // Create the menubar
    $rootScope.menubar = nwService.createMenu({
        root: {
            type:'menubar',
            items:[
                {label:'File', items:[
                    {label: 'New...', tooltip: 'Create a new file', click:'new-file', modifiers: 'cmd', key: 'n'},
                    {label: 'Open...', tooltip: 'Open a file', click:'open-file', modifiers: 'cmd', key: 'o'},
                    {label: 'Close', tooltip: 'Close a file', click:'close-file', modifiers: 'cmd', key: 'w'},
                    {label: 'Close All', tooltip: 'Close all currently open files', click:'close-all', modifiers: 'cmd, shift', key: 'w'},
                    {type:'separator'},
                    {label: 'Save', tooltip: 'Save a file', click:'save-file', modifiers: 'cmd', key: 's'},
                    {label: 'Save All', tooltip: 'Save all files', click:'save-all', modifiers: 'cmd, alt', key: 's'},
                    {label: 'Save As...', tooltip: 'Save file as...', click:'save-as', modifiers: 'cmd, shift', key: 's'}
                    //{label: 'Exit', tooltip: 'Quit Application', click:'exit-app'} //TODO: See broadcast exit-app
                ]},
                {label:'Edit', items:[
                    {label:'Undo', click:'undo', modifiers: 'cmd', key: 'z'},
                    {label:'Redo', click:'redo', modifiers: 'cmd, shift', key: 'z'},
                    {type:'separator'},
                    {label:'Cut', click:'cut', modifiers: 'cmd', key: 'x'},
                    {label: 'Copy', click:'copy', modifiers: 'cmd', key: 'c'},
                    {label: 'Paste', click:'paste', modifiers: 'cmd', key: 'v'},
                    {type:'separator'},
                    {label:'Find', click:'find', modifiers: 'cmd', key: 'f'},
                    {label:'Replace', click:'find-replace', modifiers: 'cmd, alt', key: 'z'}
                ]},
                {label:'Debug', items:[
                    {label:'Show Developer Tools', click:'open-debug', modifiers: 'alt, cmd', key: 'i'},
                    {label:'Reload Application', click:'reload-app',  key:'r'}
                ]}
            ]
        }
    });
});


/*
 TODO: Where to put this?
 $scope.$on('exit-app', function(e, menu, item) {
 this.gui.Window.get().close();
 });
 */
