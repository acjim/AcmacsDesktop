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

/**
 * Filter which Abbreviates the values of seras
 *
 * @returns abbrev abbreviated Sera names
 */
app.filter('abbreviateSeraNames', function() {
    return function(input) {
        var abbrev = input.slice(0, 2) + "" + input.slice(input.length - 2, input.length);
        return abbrev;
    }
});

app.controller('tableCtrl', ['$rootScope', '$scope', 'fileHandling', function ($rootScope, $scope, fileHandling) {

        $scope.clickedAntigen = '';

        $scope.antigenColumnClick = function (antigen) {
            $scope.clickedAntigen = antigen;
            $rootScope.$broadcast('clicked-table', {
                antigens: antigen // send antigen
            });
        };

        $scope.$on('api.update_table', function () {
            fileHandling.updateTable($scope);
        });

    }])
    .directive('acTable', function () {
        return {
            controller: 'tableCtrl',
            controllerAs: 'data',
            templateUrl: './app/components/table/tableView.html',
            link: function (scope, iElement) {
                scope.editItem = function (obj, parent_index, index) {
                    obj.target.setAttribute("contenteditable", true);
                    obj.target.focus();
                    var element = angular.element(event.currentTarget);
                    element.bind("keydown keypress", function (event) {
                        if (event.which === 13 || event.which === 27) {
                            obj.target.setAttribute("contenteditable", false);
                            event.preventDefault();
                            if (scope.data.table.table.titers.titers_list_of_list) {
                                scope.data.table.table.titers.titers_list_of_list[parent_index][index] = element.text();
                            } else if (scope.data.table.table.titers.titers_list_of_dict) {
                                scope.data.table.table.titers.titers_list_of_dict[parent_index][index] = element.text();
                            }
                            scope.data.modified = true;
                            scope.$apply();
                        }
                    });
                };
            },
            restrict: 'AEC',
            bindToController: {
                table: '='
            }
        }
    });