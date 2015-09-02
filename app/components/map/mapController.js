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

var app = angular.module('acjim.map',[]);

app.controller('mapCtrl', ['$scope', function($scope){
//                // Build d3 data objects from json data
//                graph.layout.forEach(function (d, i) {
//                    data[i] = {
//                        "x": d[0] * scaleValue,
//                        "y": d[1] * scaleValue,
//                        "name": graph.point_info[i],
//                        "style": graph.styles.styles[graph.styles.points[i]]
//                    };
//                });


    $scope.d3Data = [
        //{x: 30, y:12, style: {shape: "circle"}},
        //{x: 40, y:43, style: {shape: "circle"}},
        //{x: 20, y: 87, style: {shape: "box"}}
    ];
    $scope.mapData.map[0].layout.forEach(function(point) {
        $scope.d3Data.push({x: point[0], y:point[1], style: {shape: "circle"}})
    });
}])

    .directive('acMap', function() {
        return {
            restrict: 'A',
            transclude: true,
            scope: {},
            bindToController: {
                map: '='
            },
            controller: 'mapCtrl',
            controllerAs: 'mapData',
            templateUrl: './app/components/map/mapView.html'
        }
    });

app.directive('d3Map', ['$rootScope', function($rootScope) {
    return {
        restrict: 'A',
        scope: {
            data: "=",
            label: "@"
        },
        link: function(scope, iElement, iAttrs) {

            var svg = d3.select(iElement[0])
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%");
            scope.padding = 0; // top, left, right, down for padding purposes. 2% of the height and width. This variable will be dynamically computed by getting the width and height.
            scope.initialWidth = d3.select(iElement[0])[0][0].offsetWidth;
            scope.initialHeight = d3.select(iElement[0])[0][0].offsetHeight;
            scope.dataExtent = d3.extent(scope.data, function(d) { return d.x;});
            scope.dataExtenty = d3.extent(scope.data, function(d) { return d.y;});


            // Initial zoom values

            function centerNodes (scope){
                var dx= scope.dataExtent;
                var dy= scope.dataExtenty;
                var xDistance =Math.abs(dx[0] - dx[1]);



                xDistance =(scope.initialWidth-xDistance)/2;
                xDistance= xDistance-dx[0];
                var yDistance =Math.abs(dy[0] - dy[1]);
                yDistance =(scope.initialHeight-yDistance)/2;
                yDistance= yDistance-dy[0];
                return [xDistance,yDistance];

            }
            scope.translate = centerNodes(scope);

            scope.scale = 1;
            scope.gridScale = 1;
            scope.gridTranslate = [0, 0];


            //Cache zoom values
            scope.cacheZoomValues = function() {
                scope.translate = scope.zoom.translate();
                scope.scale = scope.zoom.scale();
            }

            // Render with data
            scope.renderWithData = function(data){

                // remove all previous items before render
                svg.selectAll("*").remove();

                // setup variables
                var width = d3.select(iElement[0])[0][0].offsetWidth,
                    height = d3.select(iElement[0])[0][0].offsetHeight,
                    boxSize = scope.initialWidth/(Math.abs(scope.dataExtent[1] - scope.dataExtent[0])),
                    shiftKey;

                // Scale
                var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
                var yScale = d3.scale.linear().domain([0,height]).range([0, height]);
                var dataScale = d3.scale.linear().domain(d3.extent(data, function(d) { return d.x; })).range([0, scope.initialWidth]);


                // Zoom
                scope.zoom = d3.behavior.zoom()
                    .scaleExtent([1, 10])
                    .x(xScale)
                    .y(yScale)
                    .translate(scope.translate)
                    .scale(scope.scale)
                    .on("zoom", function() {

                        // Move the grid
                        scope.gridTranslate = d3.event.translate[0]%(boxSize*d3.event.scale)+","+d3.event.translate[1]%(boxSize*d3.event.scale);
                        scope.gridScale = d3.event.scale;
                        boxG.attr("transform",
                            "translate(" + scope.gridTranslate + ")scale(" + scope.gridScale + ")")
                        // Move the graph
                        node.attr("transform", function (d) {
                            return "translate("+xScale(d.x)+", "+yScale(d.y)+")"

                        });
                    });


                // Groups
                var boxG = svg.append("g")
                    .attr("transform", "translate(" + scope.gridTranslate + ")scale(" + scope.gridScale + ")");
                var brush = svg.append("g")
                    .datum(function() { return {selected: false, previouslySelected: false}; })
                    .attr("class", "brush");
                var elements = svg.append("g");

                // Links
                var link = elements.append("g")
                    .attr("class", "link")
                    .selectAll("line");

                // Nodes
                var node = elements.append("g")
                    .attr("class", "node")
                    .selectAll(".node");

                // Background Grid
                var numBoxesX = width/boxSize;
                var xLines = boxG.append("g").selectAll("line").data(d3.range(0, numBoxesX + 1)).enter();

                var numBoxesY = height/boxSize;
                var yLines = boxG.append("g").selectAll("line").data(d3.range(0, numBoxesY + 1)).enter();

                xLines.append("line")
                    .attr("class", "x axis")
                    .attr("x1", function (d){return d * boxSize})
                    .attr("x2", function (d){return d * boxSize;})
                    .attr("y1", -boxSize)
                    .attr("y2", height + boxSize);
                yLines.append("line")
                    .attr("class", "y axis")
                    .attr("x1", -boxSize)
                    .attr("x2", width + boxSize)
                    .attr("y1", function (d){return d * boxSize})
                    .attr("y2", function (d){return d * boxSize});


                // Brush
                var brusher = d3.svg.brush()
                    .x(xScale)
                    .y(yScale)
                    .on("brushstart", function(d) {
                        node.each(function(d) {
                            d.previouslySelected = shiftKey && d.selected; });
                    })
                    .on("brush", function() {
                        var extent = d3.event.target.extent();
                        node.classed("selected", function(d) {
                            return d.selected = d.previouslySelected ^
                            (extent[0][0] <= d.x && d.x < extent[1][0]
                            && extent[0][1] <= d.y && d.y < extent[1][1]);
                        });
                    })
                    .on("brushend", function() {
                        d3.event.target.clear();
                        d3.select(this).call(d3.event.target);
                    }
                );

                //TODO: Add links and error lines
//              graph.links.forEach(function(d) {
//                d.source = graph.nodes[d.source];
//                d.target = graph.nodes[d.target];
//              });
//
//              link = link.data(graph.links).enter().append("line")
//                  .attr("x1", function(d) { return d.x; })
//                  .attr("y1", function(d) { return d.y; })
//                  .attr("x2", function(d) { return d.target.x; })
//                  .attr("y2", function(d) { return d.target.y; });
                //Line test
//                var link = linkG.selectAll("line").data(graph.layout).enter();
//                link.append('line')
//                        .attr("x1", function(d) {return scale(d[0]); })
//                        .attr("y1", function(d) {return scale(d[1]); })
//                        .attr("x2", function(d) {return scale(d[0] + 0.2); })
//                        .attr("y2", function(d) {return scale(d[1] + 0.2); })
//                        .attr("stroke", "gray")
//                        .attr("stroke-width", "4");


                // Enter
                node = node.data(data).enter().append("path");
                // Update
                node.attr("class", "point")
                    .attr("transform", function(d) { return "translate(" + xScale(d.x = dataScale(d.x)) + "," + yScale(d.y = dataScale(d.y)) + ")"; })
                    .attr("d",d3.svg.symbol().size("50")
                        .type(function(d) {
                            if (d.style.shape == "circle") { return "circle"; }
                            else if (d.style.shape == "box") { return "square"; }
                        })
                )
                    .on("mousedown", function(d) {
                        if (!d.selected) { // Don't deselect on shift-drag.
                            if (!shiftKey) node.classed("selected", function(p) { return p.selected = d === p; });
                            else d3.select(this).classed("selected", d.selected = true);
                        }
                    })
                    .on("mouseup", function(d) {
                        if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
                    })
                    .call(d3.behavior.drag()
                        .on("dragstart", function(d) {
                            d3.event.sourceEvent.stopPropagation();
                        })
                        .on("drag", function(d) {
                            nudge(d3.event.dx, d3.event.dy);
                        })
                );

                function nudge(dx, dy) {
                    node.filter(function(d) { return d.selected; })
                        .attr("transform", function(d) {
                            d.x += dx/scope.zoom.scale();
                            d.y += dy/scope.zoom.scale();
                            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                        });
                    /*
                     link.filter(function(d) { return d.source.selected; })
                     .attr("x1", function(d) { return d.source.x; })
                     .attr("y1", function(d) { return d.source.y; });
                     link.filter(function(d) { return d.target.selected; })
                     .attr("x2", function(d) { return d.target.x; })
                     .attr("y2", function(d) { return d.target.y; });
                     */
                    if(d3.event.preventDefault) d3.event.preventDefault();
                }

                // Tool handling
                function addTools() {
                    var tools = {
                        'brush': function () {
                            // Remove zoom
                            svg.on('.zoom', null);

                            // Enable brush
                            brush.select('.background').style('cursor', 'crosshair');
                            brush.call(brusher);
                        },
                        'zoom': function () {
                            // Disable brush
                            brush.call(brusher)
                                .on("mousedown.brush", null)
                                .on("touchstart.brush", null)
                                .on("touchmove.brush", null)
                                .on("touchend.brush", null);
                            brush.select('.background').style('cursor', 'default');

                            //Enable zoom
                            svg.call(scope.zoom);
                        }
                    }
                    tools[$rootScope.mapTool]();
                }
                addTools();
                $rootScope.$on('tool.changed', function(event) {
                    addTools();
                });


                /*
                 function keydown() {
                 if (!d3.event.metaKey) switch (d3.event.keyCode) {
                 case 38: nudge( 0, -1); break; // UP
                 case 40: nudge( 0, +1); break; // DOWN
                 case 37: nudge(-1,  0); break; // LEFT
                 case 39: nudge(+1,  0); break; // RIGHT
                 case 32: svg.call(zoom); break;// SPACE
                 }
                 shiftKey = d3.event.shiftKey || d3.event.metaKey;
                 }
                 function keyup() {
                 shiftKey = d3.event.shiftKey || d3.event.metaKey;
                 svg.on('.zoom', null);
                 }
                 */



            };


            //****************** Listeners **********************//

            // on container resize, re-render d3
            scope.$on('container-resized', function(event) {
                scope.cacheZoomValues();
                return scope.renderWithData(scope.data);
            });

            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
                return scope.renderWithData(newVals);
            }); //, true); //FIXME: seems to have a problem. Maybe use a notification+listener for new data instead
        }
    };
}]);
