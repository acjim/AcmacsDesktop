'use strict';

var app = angular.module('acjim.map',[]);

app.controller('mapCtrl', ['$scope', function($scope){
    $scope.title = "mapCtrl";

    $scope.mapData = {};

    $scope.$on('handleBroadcast', function () {
        console.log("handleBroadcast in Table", mapService.message);
        $scope.mapData = mapService.message.projections[0].layout;
        $scope.$apply();
    });

      $scope.d3Data = [
        {title: "Greg", score:12},
        {title: "Ari", score:43},
        {title: "Loser", score: 87}
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
                .attr("width", "100%")
                .attr("height", "100%");

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
                var width = d3.select(iElement[0])[0][0].offsetWidth,  //TODO: BUGFIXING!! when parent hidden this returns 0!
                    height = d3.select(iElement[0])[0][0].offsetHeight,
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
                    .selectAll(".node")

                // Background Grid
                var boxSize = 1 * scaleValue;
                var numBoxes = width/boxSize;
                console.log(width);
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

//                graph.layout.forEach(function (d, i) {
//                    data[i] = {
//                        "x": d[0] * scaleValue,
//                        "y": d[1] * scaleValue,
//                        "name": graph.point_info[i],
//                        "style": graph.styles.styles[graph.styles.points[i]]
//                    };
//                });

                // Enter
                node = node.data(data).enter().append("path");
                // Update
                node.attr("class", "point")
                    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
                    .attr("d",d3.svg.symbol().size("20")
                          .type(function(d) {
                        if (d.style.shape == "circle") { return "circle"; }
                        else if (d.style.shape == "box") { return "square"; }
                    }))
                    .on("mousedown", function(d) {
                        if (!d.selected) { // Don't deselect on shift-drag.
                          if (!shiftKey) node.classed("selected", function(p) { return p.selected = d === p; });
                          else d3.select(this).classed("selected", d.selected = true);
                          console.log(d);
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



              };
        }
      };
    }]);
