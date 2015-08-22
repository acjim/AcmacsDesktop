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
    'ngWindowManager',
    'bgDirectives'
]);

app.filter('nl2br', require('./app/shared/nl2br.js'));

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
