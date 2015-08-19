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

app.controller('mapCtrl', ['$scope', 'mapService', function($scope, mapService){
    $scope.title = "mapCtrl";

    $scope.mapData = {};

    $scope.$on('handleBroadcast', function () {
        console.log("handleBroadcast in Table", mapService.message);
        $scope.mapData = mapService.message.projections[0].layout;
        $scope.$apply();
    });

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
        {x: 30, y:12, style: {shape: "circle"}},
        {x: 40, y:43, style: {shape: "circle"}},
        {x: 20, y: 87, style: {shape: "box"}}
    ];
}]);


app.directive('d3Map', [function() {
    return {
        restrict: 'EA',
        scope: {
            data: "=",
            label: "@"
        },
        link: function(scope, iElement, iAttrs) {

            var svg = d3.select(iElement[0])
                .append("svg")
                .attr("width", 300)     //TODO: dynamic d3 size
                .attr("height", 300);

            // on window resize, re-render d3 canvas
            window.onresize = function() {
                return scope.$apply();
            };
            scope.$watch(function(){
                return angular.element(window)[0].innerWidth;
            }, function(){
                return scope.render(scope.data);
            });

            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
                return scope.render(newVals);
            }, true);

            // define render function
            scope.render = function(data){

                // remove all previous items before render
                svg.selectAll("*").remove();

                // setup variables
                //TODO: dynamic d3 size
                var width = 300,//d3.select(iElement[0])[0][0].offsetWidth,  //TODO: BUGFIXING!! when parent hidden this returns 0!
                    height = 300, //d3.select(iElement[0])[0][0].offsetHeight,
                    scaleValue = 10,
                    boxSize,
                    shiftKey;

                // this can also be found dynamically when the data is not static
                // max = Math.max.apply(Math, _.map(data, ((val)-> val.count)))

                // Scale
                var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
                var yScale = d3.scale.linear().domain([0,height]).range([0, height]);
                // Zoom
                var zoom = d3.behavior.zoom()
                    .scaleExtent([1, 10])
                    .x(xScale)
                    .y(yScale)
                    .on("zoom", function() {
                        // Move the grid
                        boxG.attr("transform",
                                  "translate(" + d3.event.translate[0]%(boxSize*d3.event.scale)+","+d3.event.translate[1]%(boxSize*d3.event.scale) + ")scale(" + d3.event.scale + ")")
                        // Move the graph
                        elements.attr("transform",
                                   "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                    });

                // Groups
                var boxG = svg.append("g");
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
                var boxSize = 1 * scaleValue;
                var numBoxes = width/boxSize;
                var boxEnter = boxG.selectAll("line").data(d3.range(0, numBoxes + 1)).enter();

                boxEnter.append("line")
                    .attr("class", "x axis")
                    .attr("x1", function (d){return d * boxSize})
                    .attr("x2", function (d){return d * boxSize;})
                    .attr("y1", -boxSize)
                    .attr("y2", height + boxSize);
                boxEnter.append("line")
                    .attr("class", "x axis")
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
                brush.call(brusher);

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
                    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
                    .attr("d",d3.svg.symbol().size("20")
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
                                d.x += dx;
                                d.y += dy;
                                return "translate(" + d.x + "," + d.y + ")";
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

                    // Tool switching TODO: Refactor
                    d3.select("#moove").on("change", function() {
                        if (this.checked) {
                            // Enable zoom
                            svg.call(zoom);
                            // Disable brush
                            brush.call(brusher)
                                .on("mousedown.brush", null)
                                .on("touchstart.brush", null)
                                .on("touchmove.brush", null)
                                .on("touchend.brush", null);
                            brush.select('.background').style('cursor', 'auto');
                        } else {
                            // Disable zoom
                            svg.on('.zoom', null);
                            // Enable brush
                            brush.select('.background').style('cursor', 'crosshair');
                            brush.call(brusher);
                        }
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
        }
      };
    }]);
