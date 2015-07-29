'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('acjim', [
    'ngRoute',
    'ui.bootstrap',
    'DWand.nw-fileDialog'
]);

//app.factory('fileDialog', require('./app/components/filehandling/fileDialog.js')); //TODO: Fixme? Current this is a src include in the index.html
app.factory('mapService', require('./app/shared/mapService.js'));
app.filter('nl2br', require('./app/shared/nl2br.js'));

app.controller('tableCtrl', ['$scope', '$http', 'mapService', require('./app/components/table/tableController.js')]);
app.controller('mapCtrl', ['$scope', '$http', 'mapService', require('./app/components/map/mapController.js')]);
app.controller('filehandlingCtrl', ['$scope', '$http', 'mapService', 'fileDialog', require('./app/components/filehandling/filehandlingController.js')]);

app.config(['$routeProvider', function($routeProvider) {
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
}]);


app.service('nwService', ['$rootScope', '$q', function($rootScope, $q)  {

    // Expose gui and main window
    var gui = this.gui = require("nw.gui");

    this.window = this.gui.Window.get();

    // Start application in maximized mode
    //this.window.maximize();
    this.window.show();

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
                hideWindow: false
            });
        }

        // Create sub-menu items if they're provided
        if(menuStructure.root && menuStructure.root.items) {

            console.log("Creating %d menu items for root menu", menuStructure.root.items.length);
            createMenuItems(menu, menuStructure.root.items);
        }

        if(menu.type === 'menubar') {
            this.window.menu = menu;
        }

        return menu;
    };

    function createMenuItems(menu, items) {

        _.each(items, function(i) {

            console.log("Creating item", i.label);

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
            console.log("appending item %s to menu", i.label);
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
                    {label: 'New...', tooltip: 'Create a new file', click:'new-file'},
                    {label: 'Open...', tooltip: 'Open a file', click:'open-file'},
                    {label: 'Save', tooltip: 'Save a file', click:'save-file'},
                    {label: 'Close', tooltip: 'Close a file', click:'close-file'},
                    //{type:'separator'},
                    //{label: 'Exit', tooltip: 'Quit Application', click:'exit-app'} //TODO: See broadcast exit-app
                ]},
                {label:'Edit', items:[
                    {label:'Cut', click:'cut'},
                    {label: 'Copy', click:'copy'},
                    {label: 'Paste', click:'paste'},
                    {type:'separator'},
                    {label:'Find', click:'find'},
                    {label:'Replace', click:'find-replace'}
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
