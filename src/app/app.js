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
    'ui.layout',
    'acjim.fileHandling',
    'acjim.api',
    'acjim.map',
    'acjim.table',
    'acjim.toolbar',
    'ngHtmlWindow',
    'angular-loading-bar',
    'ngAnimate',
    'DWand.nw-fileDialog'
]);

angular.module('acjim.toolbar', []);

app.run(function(nwService, $rootScope, toolbar, toolbarItems) {

    var osModifier = process.platform === 'darwin' ? 'cmd' : 'ctrl';

    // Create the menu bar
    $rootScope.menubar = nwService.createMenu({
        root: {
            type:'menubar',
            items:[
                {label:'File', items:[
                    {label: 'New...', tooltip: 'Create a new file', click:'new-file', modifiers: osModifier, key: 'n'},
                    {label: 'Open...', tooltip: 'Open a file', click:'open-file', modifiers: osModifier, key: 'o'},
                    {label: 'Close', tooltip: 'Close a file', click:'close-file', modifiers: osModifier, key: 'w'},
                    {label: 'Close All', tooltip: 'Close all currently open files', click:'close-all', modifiers: osModifier + 'shift', key: 'w'},
                    {type:'separator'},
                    {label: 'Save', tooltip: 'Save a file', click:'save-file', modifiers: osModifier, key: 's'},
                    {label: 'Save All', tooltip: 'Save all files', click:'save-all', modifiers: osModifier + 'alt', key: 's'},
                    {label: 'Save As...', tooltip: 'Save file as...', click:'save-as', modifiers: osModifier + 'shift', key: 's'},
                    {label: 'Exit', tooltip: 'Quit Application', click:'exit-app'} //TODO: See broadcast exit-app
                ]},
                {label:'Edit', items:[
                    {label:'Undo', click:'undo', modifiers: osModifier, key: 'z'},
                    {label:'Redo', click:'redo', modifiers: osModifier + 'shift', key: 'z'},
                    {type:'separator'},
                    {label:'Cut', click:'cut', modifiers: osModifier, key: 'x'},
                    {label: 'Copy', click:'copy', modifiers: osModifier, key: 'c'},
                    {label: 'Paste', click:'paste', modifiers: osModifier, key: 'v'},
                    {type:'separator'},
                    {label:'Find', click:'find', modifiers: osModifier, key: 'f'},
                    {label:'Replace', click:'find-replace', modifiers: osModifier + 'alt', key: 'z'}
                ]},
                {label:'Backend', items:[
                    {label:'Reoptimization Map', click:'api.reoptimize', modifiers: osModifier + 'alt', key: 'r'},
                    {label:'Show Error Lines', click:'api.geterrorlines'},
                    {label:'Show Connection Lines', click:'api.getconnectionlines'}
                ]},
                {label:'Debug', items:[
                    {label:'Show Developer Tools', click:'open-debug', modifiers: osModifier + 'alt', key: 'i'},
                    {label:'Reload Application', click:'reload-app',  key:'r'}
                ]}
            ]
        }
    });

    //Create the toolbar
    toolbar.init([
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.SELECTION,
                    caption: 'Selection',
                    active: true,
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'glyphicon glyphicon-unchecked',
                    callback: function () {
                        $rootScope.$emit('tool.selected');
                    }
                },
                {
                    id: toolbarItems.MOVEMENT,
                    caption: 'Movement',
                    groupID: toolbarItems.MAP_TOOLS,
                    icon: 'glyphicon glyphicon-move',
                    callback: function () {
                        $rootScope.$emit('tool.selected');
                    }
                }
            ]
        },
        {
            type: "buttonGroup",
            buttons: [
                {
                    id: toolbarItems.SHOW_ERROR_LINES,
                    caption: 'Show Error Lines',
                    icon: 'glyphicon glyphicon-transfer',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('api.geterrorlines');
                    }
                },
                {
                    id: toolbarItems.SHOW_CONNECTION_LINES,
                    caption: 'Show Connection Lines',
                    icon: 'glyphicon glyphicon glyphicon-road',
                    togglable: true,
                    callback: function () {
                        $rootScope.$emit('api.getconnectionlines');
                    }
                }
            ]
        },
        {
            id: toolbarItems.RE_OPTIMIZE,
            caption: 'Reoptimize',
            icon: 'glyphicon glyphicon-refresh',
            callback: function () {
                $rootScope.$broadcast('api.reoptimize');
            }
        }
    ]);

});
