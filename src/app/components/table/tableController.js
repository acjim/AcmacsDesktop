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

var app = angular.module('acjim.table', []);

app.controller('tableCtrl',  ['$rootScope', '$scope', function ($rootScope, $scope) {
}])

    .directive('acTable', function () {
        return {
            controller: 'tableCtrl',
            controllerAs: 'data',
            templateUrl: './app/components/table/tableView.html',
            restrict: 'E',
            bindToController: {
                table: '='
            }
        }
    });