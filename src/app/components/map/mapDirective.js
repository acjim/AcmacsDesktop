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

var app = angular.module('acjim.map');

/*
 * D3 directive
 */
app.directive('d3Map', ['$rootScope', '$window', '$timeout', 'toolbar', 'toolbarItems', 'dialogs', function ($rootScope, $window, $timeout, toolbar, toolbarItems, dialogs) {
    return {
        restrict: 'A',
        scope: {
            data: "="
        },
        controller: 'mapCtrl',
        template: '<p class="stressLabel">Stress: {{(data.stress || "Undefined Value") | number: 3}}</p>',
        link: function (scope, iElement) {

            var svg = null,
                width = 0,
                height = 0,
                xScale = null,
                yScale = null,
                zoom = null,
                minimalScaleValue = null,
                translate = [0, 0],
                scale = 1,
                gridTranslate = [0, 0],
                gridScale = 1,
                initialScale = 1,
                initialTranslate = [0, 0],
                brush = null,
                dataExtentX = null,
                dataExtentY = null,
                boxSize = 1,
                flagDisconnectDisable= 0,
                colorArray = [],
                disableArray = [],
                fixedArray= [],
                color = "",
                shiftKey;

            // d3 groups
            var boxGroup,
                brushGroup,
                elementGroup,
                nodeGroup,
                errorlineGroup,
                connectionlineGroup,
                labelsGroup;

            /**
             * (Re)draws the d3 map without removing the data points.
             * Redefines x and y scales and reapplies them to the zoom, nodes and brush.
             * Initializes zoom (with cached values if possible).
             * Creates background grid.
             */
            function renderWithoutData() {

                // get new width and height of svg
                width = getContainerWidth();
                height = getContainerHeight();

                // Scale
                xScale = d3.scale.linear().domain([0, width]).range([0, width]);
                yScale = d3.scale.linear().domain([0, height]).range([0, height]);

                // Zoom
                zoom = d3.behavior.zoom()
                    .scaleExtent([minimalScaleValue, 500])
                    .x(xScale)
                    .y(yScale)
                    .translate(translate)
                    .scale(scale)
                    .on("zoomstart", zoomStart)
                    .on("zoom", applyZoom);

                // reapply scales on the data, only if data is already defined, otherwise wait
                if (!_.isUndefined(nodeGroup)) {
                    nodeGroup.attr("transform", function (d) {
                        return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                    });

                    if (labelsGroup) {
                        labelsGroup.attr("transform", function (d) {
                            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                        });
                    }
                    // Create brush
                    brush = createBrush();

                    // Create background grid
                    if (boxGroup)
                        boxGroup = redrawGrid(boxGroup, boxSize, width / minimalScaleValue, height / minimalScaleValue);

                    manageMapTools();
                    applyZoom();
                }
            }

            /**
             * Renders the complete d3 map with data
             * @param data
             */
            function renderWithData(data) {

                // checks if the map is drawn the for the first time, adds svg, groups and zoom if necessary
                if (!svg) {
                    initializeSVG();
                }

                renderWithoutData();

                // Enter
                nodeGroup = nodeGroup.data(data.layout);

                nodeGroup.enter().append("path")
                    .attr("class", "point");

                //Update
                nodeGroup
                    .attr("transform", function (d) {
                        return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                    })
                    .attr("fill", function (d) {
                        // color as string
                        if (_.isArray(d.style.fill_color)) {
                            return d.style.fill_color[0];
                        } else {
                            return d.style.fill_color;
                        }
                    })
                    .attr("fill-opacity", function (d) {
                        if (_.isArray(d.style.fill_color)) {
                            return d.style.fill_color[1];
                        } else {
                            return 1;
                        }
                    })
                    .attr("stroke", "#474747")
                    .attr("name", function (d) {
                        return d.name
                    })
                    .attr("label_version", function (d, i) {
                        return i;        // slug = label downcased, this works
                    })
                    .attr("d", d3.svg.symbol().size("50")
                        .type(function (d) {
                            if (d.style.shape === "circle") {
                                return "circle";
                            }
                            else if (d.style.shape === "box") {
                                return "square";
                            }
                        }));

                // Event handlers
                nodeGroup.on("mousedown", function (d) {
                        if (!d.selected) { // Don't deselect on shift-drag.
                            if (!shiftKey) {
                                nodeGroup.classed("selected", function (p) {
                                    return p.selected = d === p;
                                });
                            } else {
                                d3.select(this).classed("selected", d.selected = true);
                            }
                        }
                    })
                    .on("mouseup", function (d) {
                        if (d.selected && shiftKey) {
                            d3.select(this).classed("selected", d.selected = false);
                        }
                    })

                    .call(d3.behavior.drag()
                        .on("dragstart", function () {
                            d3.event.sourceEvent.stopPropagation();
                        })
                        .on("drag", function () {
                            nudge(d3.event.dx, d3.event.dy);
                        })
                        .on("dragend", function () {
                            if (scope.showErrorLines || scope.showConnectionLines) {
                                scope.$emit('map.nudgeTriggeredOnLine');
                            } else {
                                scope.$emit('map.nudgeTriggered');
                            }
                        })
                    )
                    .attr("opacity", (function (d) {
                        return d.opacity;
                    }));

                // Exit
                nodeGroup.exit().remove();


                labelsGroup = labelsGroup.data(data.layout);
                labelsGroup.enter().append("text")
                    .attr("class", "text")
                    .attr("transform", function (d) {
                        return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                    })
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    })
                    .style("visibility", "hidden")
                    .style("font-family", "sans-serif")
                    .style("font-size", "10px")
                    .style("fill", "#330066")
                    .text(function (d) {
                        return d.name;
                    });
                labelsGroup.exit().remove();


                errorlineGroup = errorlineGroup.data(data.d3ErrorLines);
                errorlineGroup.enter().append("line")
                    .attr("class", "errorline")
                    .attr("x1", (function (d) {
                        return xScale(d.x1);
                    }))
                    .attr("y1", (function (d) {
                        return yScale(d.y1);
                    }))
                    .attr("x2", (function (d) {
                        return xScale(d.x2);
                    }))
                    .attr("y2", (function (d) {
                        return yScale(d.y2);
                    }))
                    .attr("stroke", (function (d) {
                        return d.stroke;
                    } ))
                    .attr("stroke-width", (function (d) {
                        return d.width;
                    }))
                    .attr("opacity", (function (d) {
                        return d.opacity;
                    }));
                errorlineGroup.exit().remove();

                connectionlineGroup = connectionlineGroup.data(data.d3ConnectionLines);
                connectionlineGroup.enter().append("line")
                    .attr("class", "connectionline")
                    .attr("x1", (function (d) {
                        return xScale(d.x1);
                    }))
                    .attr("y1", (function (d) {
                        return yScale(d.y1);
                    }))
                    .attr("x2", (function (d) {
                        return xScale(d.x2);
                    }))
                    .attr("y2", (function (d) {
                        return yScale(d.y2);
                    }))
                    .attr("stroke", (function (d) {
                        return d.stroke;
                    } ))
                    .attr("stroke-width", (function (d) {
                        return d.width;
                    }));
                connectionlineGroup.exit().remove();

            }

            /**
             * Adds the selected tool functionality to the d3 map
             */
            function manageMapTools() {

                var currentTool = toolbar.getActiveItemFromGroup(toolbarItems.MAP_TOOLS);

                switch (currentTool.id) {
                    case toolbarItems.SELECTION:
                        enableSelectionTool();
                        break;
                    case toolbarItems.MOVEMENT:
                        enableMovementTool();
                        break;
                    default:
                        //console.log("Didn't recognize the tool given and did nothing. Could it be that no tool is selected?");
                        break;
                }

            }

            /**
             * Enables the selection tool (brush) on the SVG
             */
            function enableSelectionTool() {
                // Remove zoom
                svg.on('.zoom', null);

                // Enable brush
                brushGroup.select('.background').style('cursor', 'crosshair');
                brushGroup.selectAll(".extent").style('cursor', 'crosshair');
                brushGroup.call(brush);
            }

            /**
             * Enables the movement tool (zoom) on the SVG
             */
            function enableMovementTool() {
                // Disable brush
                brushGroup.call(brush)
                    .on("mousedown.brush", null)
                    .on("touchstart.brush", null)
                    .on("touchmove.brush", null)
                    .on("touchend.brush", null);
                brushGroup.select('.background').style('cursor', 'move');

                //Enable zoom
                svg.call(zoom);
            }

            /**
             * Initializes the svg. This function should only be called once for each directive.
             */
            function initializeSVG() {

                if (svg) {
                    return;
                }

                d3.select("body")
                    .on("keydown", keydown)
                    .on("keyup", keyup);

                // Initialize SVG element
                svg = d3.select(iElement[0])
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%");

                width = getContainerWidth();
                height = getContainerHeight();

                dataExtentX = d3.extent(scope.data.layout, function (d) {
                    return d.x;
                });
                dataExtentY = d3.extent(scope.data.layout, function (d) {
                    return d.y;
                });

                centerNodes();

                // Add groups in the right order to the svg
                boxGroup = svg.append("g")
                    .attr("transform", "translate(" + gridTranslate + ")scale(" + gridScale + ")");

                brushGroup = svg.append("g")
                    .datum(function () {
                        return {selected: false, previouslySelected: false};
                    })
                    .attr("class", "brush");

                elementGroup = svg.append("g");

                connectionlineGroup = elementGroup.append("g")
                    .attr("class", "connectionline")
                    .selectAll(".connectionline");

                errorlineGroup = elementGroup.append("g")
                    .attr("class", "errorline")
                    .selectAll(".errorline");

                nodeGroup = elementGroup.append("g")
                    .attr("class", "node")
                    .selectAll(".node");
                labelsGroup = elementGroup.append("g")
                    .attr("class", "text")
                    .selectAll(".text");

                scope.$emit('map.loaded');

            }

            /**
             * Creates the brush
             * @returns {d3.svg.brush}
             */
            function createBrush() {
                brush = d3.svg.brush()
                    .x(xScale)
                    .y(yScale)
                    .on("brushstart", function () {
                        nodeGroup.each(function (d) {
                            d.previouslySelected = shiftKey && d.selected;
                        });
                    })
                    .on("brush", function () {
                        var extent = d3.event.target.extent();
                        nodeGroup.classed("selected", function (d) {
                            return d.selected = d.previouslySelected ^
                                (extent[0][0] <= d.x && d.x < extent[1][0]
                                && extent[0][1] <= d.y && d.y < extent[1][1]);
                        });
                    })
                    .on("brushend", function () {
                            d3.event.target.clear();
                            d3.select(this).call(d3.event.target);
                        }
                    );
                return brush;
            }

            /**
             * Moves each selected point the distance provided by the parameters
             * @param dx The delta x value
             * @param dy The delta y value
             */
            function nudge(dx, dy) {
                nodeGroup.filter(function (d) {
                        return d.selected;
                    })
                    .attr("transform", function (d) {
                        if (d.style.fill_color != "#bebebe") {
                            d.x += dx / zoom.scale();
                            d.y += dy / zoom.scale();
                            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                        }
                        else {
                            d.x += 0 / zoom.scale();
                            d.y += 0 / zoom.scale();
                            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                        }
                    });

                if (d3.event.preventDefault) {
                    d3.event.preventDefault();
                }

                scope.pointsMoved = true;
            }

            /**
             * Center the nodes in the middle of the svg
             */
            function centerNodes() {

                var dataWidthX = Math.abs(dataExtentX[1] - dataExtentX[0]),
                    dataWidthY = Math.abs(dataExtentY[1] - dataExtentY[0]);

                // how much larger the drawing area is than the width and the height
                var width_ratio = width / dataWidthX;
                var height_ratio = height / dataWidthY;

                // we need to fit it in both directions, so we scale according to
                // the direction in which we need to shrink the most
                scale = initialScale = gridScale = Math.min(width_ratio, height_ratio) * 0.8;
                minimalScaleValue = scale * 0.2;

                // translate so that it's in the center of the window
                initialTranslate[0] = translate[0] = -(dataExtentX[0]) * initialScale + (width - dataWidthX * initialScale) / 2;
                initialTranslate[1] = translate[1] = -(dataExtentY[0]) * initialScale + (height - dataWidthY * initialScale) / 2;
            }

            /**
             * Handles zoom clicks over the toolbar buttons
             * @returns {boolean}
             */
            function zoomClick(direction) {
                svg.call(zoom.event); // https://github.com/mbostock/d3/issues/2387

                // Record the coordinates (in data space) of the center (in screen space).
                var center0 = [width / 2, height / 2],
                    translate0 = zoom.translate(),
                    coordinates0 = coordinates(center0);

                zoom.scale(zoom.scale() * Math.pow(2, +direction));

                // Translate back to the center.
                var center1 = point(coordinates0);
                zoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);
                svg.transition().duration(200).call(zoom.event);

                applyZoom();
            }

            function coordinates(point) {
                var scale = zoom.scale(), translate = zoom.translate();
                return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
            }

            function point(coordinates) {
                var scale = zoom.scale(), translate = zoom.translate();
                return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
            }


            /**
             * Deselects all nodes when using the zoom
             */
            function zoomStart() {
                nodeGroup.each(function(d) {
                    d.selected = false;
                    d.previouslySelected = false;
                });
                nodeGroup.classed("selected", false);
            }


            /**
             * Applies the current zoom and moves the objects accordingly.
             * Also caches translate and scale values of the zoom for later use.
             */
            function applyZoom() {

                translate = zoom.translate();
                scale = gridScale = zoom.scale();
                gridTranslate = translate[0] % (boxSize * gridScale) + "," + translate[1] % (boxSize * gridScale);

                boxGroup.attr("transform",
                    "translate(" + gridTranslate + ")scale(" + gridScale + ")");

                // Move the graph
                nodeGroup.attr("transform", function (d) {
                    return "translate(" + xScale(d.x) + ", " + yScale(d.y) + ")";
                });// Move the text labels
                labelsGroup.attr("transform", function (d) {
                    return "translate(" + xScale(d.x) + ", " + yScale(d.y) + ")";
                });
                errorlineGroup
                    .attr("x1", (function (d) {
                        return xScale(d.x1);
                    }))
                    .attr("y1", (function (d) {
                        return yScale(d.y1);
                    }))
                    .attr("x2", (function (d) {
                        return xScale(d.x2);
                    }))
                    .attr("y2", (function (d) {
                        return yScale(d.y2);
                    }));

                connectionlineGroup
                    .attr("x1", (function (d) {
                        return xScale(d.x1);
                    }))
                    .attr("y1", (function (d) {
                        return yScale(d.y1);
                    }))
                    .attr("x2", (function (d) {
                        return xScale(d.x2);
                    }))
                    .attr("y2", (function (d) {
                        return yScale(d.y2);
                    }));
            }

            /**
             * Redraws/creates only the background grid of the map
             * @param parentContainer d3 container to append the grid to
             * @param boxSize the box size of the grid
             * @param width intended width of the grid
             * @param height intended heiht of the grid
             * @returns parentContainer
             */
            function redrawGrid(parentContainer, boxSize, width, height) {

                parentContainer.selectAll("*").remove();

                // Background Grid
                var numBoxesX = width / boxSize;
                var xLines = parentContainer.append("g").selectAll("line").data(d3.range(0, numBoxesX + 1)).enter();

                var numBoxesY = height / boxSize;
                var yLines = parentContainer.append("g").selectAll("line").data(d3.range(0, numBoxesY + 1)).enter();

                xLines.append("line")
                    .attr("class", "x axis")
                    .attr("x1", function (d) {
                        return d * boxSize;
                    })
                    .attr("x2", function (d) {
                        return d * boxSize;
                    })
                    .attr("y1", -boxSize)
                    .attr("y2", height + boxSize);
                yLines.append("line")
                    .attr("class", "y axis")
                    .attr("x1", -boxSize)
                    .attr("x2", width + boxSize)
                    .attr("y1", function (d) {
                        return d * boxSize;
                    })
                    .attr("y2", function (d) {
                        return d * boxSize;
                    });
                return parentContainer;
            }

            /**
             * Checks the width of the svg container
             * @returns {number} width
             */
            function getContainerWidth() {
                return d3.select(iElement[0])[0][0].offsetWidth;
            }

            /**
             * Checks the height of the svg container
             * @returns {number} height
             */
            function getContainerHeight() {
                return d3.select(iElement[0])[0][0].offsetHeight;
            }

            /**
             * Handles keydown events
             */
            function keydown() {
                if (!d3.event.metaKey) switch (d3.event.keyCode) {
                    case 38:
                        nudge(0, -1);
                        break; // UP
                    case 40:
                        nudge(0, +1);
                        break; // DOWN
                    case 37:
                        nudge(-1, 0);
                        break; // LEFT
                    case 39:
                        nudge(+1, 0);
                        break; // RIGHT
                }
                shiftKey = d3.event.shiftKey;
            }

            /**
             * Handles keyup events
             */
            function keyup() {
                shiftKey = d3.event.shiftKey;
            }

            /**
             * Gets All D3 Selected Elements, makes them fixed (unmovable/deselects on map):
             */
            scope.fixSelectedNodes = function() {
                //$rootScope.disableArray = [];
                var flagDisable;
                $rootScope.fixedArrayFlag = false;
                var flag = 0;
                // Disable Button Functionality
                areSelectedNodesFixed($rootScope.disableArray);
                if (flagDisconnectDisable==0) {
                    d3.selectAll(".selected").each(function (d) {
                        if (d.style.fill_color != "#bebebe") {
                            flag = 1;
                            color = d.style.fill_color;

                            colorArray["" + d.id + ""] = d.style.fill_color;
                            d.style.fill_color = "#bebebe";
                            d3.select(this).transition()
                                .style("stroke", "green")
                                .style("opacity", .4)
                                .attr("style", "fill:#bebebe");
                            d.fixed = true;
                            for (var c = 0; c < fixedArray.length; c++) {
                                if (d.id == fixedArray[c]) {
                                    flagDisable = 1;
                                }
                            }
                            if (flagDisable != 1) {
                                fixedArray.push(d.id);
                                flagDisable = 0;
                            }

                        }
                        else if ("#bebebe") {
                            flag = 1;
                            d3.select(this).transition()
                                .attr("style", "fill:" + colorArray["" + d.id + ""]);
                            d.style.fill_color = colorArray["" + d.id + ""];
                            for (var c = 0; c < fixedArray.length; c++) {
                                if (d.id == fixedArray[c]) {
                                    fixedArray.splice(c, 1);
                                    c = c - 1;
                                }
                            }
                            flag = 1;
                        }
                        else {
                        }
                    });
                    if (flag === 0) {
                        var notice = "No nodes selected, please select one or more nodes to be fixed";
                        var dlg = dialogs.notify('Notice!', notice);
                    }
                    else {
                        $rootScope.fixedArrayFlag = true;
                        $rootScope.fixedArray = fixedArray;
                        $rootScope.colorArray = colorArray;
                    }
                }else {
                    var notice = "Some selected nodes are disconnected. Reconnect them before disconnecting them or do not select them to fix them";
                    var dlg = dialogs.notify('Notice!', notice);
                }
            }

            /**
             * Gets All D3 Selected Elements, disconnects the selected points (deselects)
             */
            scope.disconnectSelectedNodes = function() {
                //$rootScope.disableArray = [];
                $rootScope.disableArrayFlag = false;
                var flag = 0;
                // Disable Button Functionality
                areSelectedNodesFixed($rootScope.fixedArray);
                if (flagDisconnectDisable==0) {
                    d3.selectAll(".selected").each(function (d) {
                        if (d.style.fill_color != "#bebebe") {
                            flag = 1;
                            colorArray["" + d.id + ""] = d.style.fill_color;
                            d.style.fill_color = "#bebebe";
                            d3.select(this).transition()
                                .style("stroke", "green")
                                .style("opacity", .4)
                                .attr("style", "fill:#bebebe");
                            disableArray.push(d.id);
                        }
                        else if ("#bebebe") {
                            flag = 1;
                            d3.select(this).transition()
                                .attr("style", "fill:" + colorArray["" + d.id + ""]);
                            d.style.fill_color = colorArray["" + d.id + ""];
                            for (var c = 0; c < disableArray.length; c++) {
                                if (d.id == disableArray[c]) {
                                    disableArray.splice(c, 1);
                                    c = c - 1;
                                }
                            }
                            flag = 1;
                        }
                        else {
                        }
                    });

                    if (flag === 0) {
                        var notice = "No nodes selected, please select one or more nodes to disconnect";
                        var dlg = dialogs.notify('Notice!', notice);
                    }
                    else {
                        $rootScope.disableArrayFlag = true;
                        $rootScope.disableArray = disableArray;
                        $rootScope.colorArray = colorArray;

                    }
                }else{
                    var notice = "Some selected nodes are fixed. Unfix them before disconnecting them or do not fix them";
                    var dlg = dialogs.notify('Notice!', notice);
                }
            }
            /**
             * checks if nodes are fixed when clicking on disconnect and vice verca
             */
            function areSelectedNodesFixed(fixedOrDisconnectedElements){
                flagDisconnectDisable=0;
                if (fixedOrDisconnectedElements) {
                    d3.selectAll(".selected").each(function (d) {
                        if (d.style.fill_color == "#bebebe") {
                            for (var c = 0; c < fixedOrDisconnectedElements.length; c++) {
                                if (d.id == fixedOrDisconnectedElements[c]) {
                                    flagDisconnectDisable = 1;
                                }
                            }
                        }
                    });
                }
            }

            /**
             * Returns the node labels of nodes or removes them depending on the case
             *
             * @returns none
             */
            function toggleNodeLabels(showLabels) {
                if (showLabels) {
                    d3.selectAll(".text").style("visibility", "visible");
                } else {
                    d3.selectAll(".text").style("visibility", "hidden");
                }
            }

            /**
             * Gets a new Map  Selected Elements With Their Respective Data.
             *
             * @param mapDataPoints Object {} mapDataPoints should be assigned to scope.data before passing it to the function
             * @param indexValue int
             * @constructor a Data Array with the new Map Data
             */
            scope.getNewDataFromCurrentMap = function (mapDataPoints, indexValue) {
                $rootScope.newMapAntigenArray = [];
                $rootScope.newMapSeraArray = [];
                $rootScope.newMapArrayflag = false;
                var mapAntigenArray = [];
                var mapSeraArray = [];
                var length = mapDataPoints.layout.length;
                for (var counter = 0; counter < length; counter++) {
                    // Antigens Case
                    if (mapDataPoints.layout[counter].style.shape == "circle") {
                        mapAntigenArray.push(counter);
                        $rootScope.newMapAntigenArray.push(counter);
                    }
                    //  sera case
                    else {
                        mapSeraArray.push(counter);
                        $rootScope.newMapSeraArray.push(counter);
                    }
                }

                var flag = 0;
                d3.selectAll(".selected").each(function (d) {
                    flag = 1;
                    if (d.style.shape == "circle") {
                        var indexOfElement = mapAntigenArray.indexOf(d.id); // 1
                        mapAntigenArray.splice(indexOfElement, 1);
                    }
                    else if (d.style.shape == "box") {
                        var indexOfElement = mapSeraArray.indexOf(d.id); // 1
                        mapSeraArray.splice(indexOfElement, 1);
                    }
                });
                if (flag === 0) {
                    var notice = "No nodes selected to create new map, please select one or more nodes";
                    var dlg = dialogs.notify('Notice!', notice);
                }
                else {
                    for (var counter = 0; counter < mapAntigenArray.length; counter++) {
                        var index = $rootScope.newMapAntigenArray.indexOf(mapAntigenArray[counter]);
                        $rootScope.newMapAntigenArray.splice(index, 1);
                    }
                    for (var counter = 0; counter < mapSeraArray.length; counter++) {
                        var index = $rootScope.newMapSeraArray.indexOf(mapSeraArray[counter]);
                        $rootScope.newMapSeraArray.splice(index, 1);
                    }
                    if (indexValue === 1) {
                        $rootScope.newMapSeraArray = mapSeraArray;
                        $rootScope.newMapAntigenArray = mapAntigenArray;
                    }
                    $rootScope.newMapArrayflag = true;
                }

            }

            /////////////////////// LISTENERS ///////////////////////

            /**
             * Handles zoom events
             */
            $rootScope.$on('map.zoomIn', function () {
                zoomClick(+1);
            });
            $rootScope.$on('map.zoomOut', function () {
                zoomClick(-1);
            });
            $rootScope.$on('map.zoomInitial', function () {
                svg.call(zoom.event); // https://github.com/mbostock/d3/issues/2387
                zoom.scale(initialScale);
                zoom.translate(initialTranslate);
                svg.transition().duration(200).call(zoom.event);
            });

            /**
             * Listens for event to get add/remove node labels
             */
            $rootScope.$on('map.showLabels', function (event, itemID) {
                $timeout(function () {
                    var item = toolbar.getItemByID(toolbarItems.SHOW_LABELS);
                    if (!itemID) {
                        item.active = !item.active;
                    }
                    toggleNodeLabels(item.active);
                });
            });

            /**
             * Listens for event to randomize the positions of Nodes
             * Randomizes points
             */
            $rootScope.$on('map.randomize', function () {
                var data = scope.data;
                _.forEach(data.layout, function (d) {
                    if (d.style.fill_color != "#bebebe") { //TODO: Check if nodes are unmovable or disconnected with d.unmovable || d.disconnected
                        d.x = (Math.random() * (dataExtentX[1] * 1.3 - dataExtentX[0] * 0.9) + dataExtentX[0] * 0.9);
                        d.y = (Math.random() * (dataExtentY[1] * 1.3 - dataExtentY[0] * 0.9) + dataExtentY[0] * 0.9);
                    }
                });
                scope.pointsMoved = true;
            });


            /**
             * Watches for a tool change
             */
            $rootScope.$on('tool.selected', manageMapTools);


            /**
             * Listens for the container/window resize events and re-renders the map
             */
            scope.$on('ui.layout.resize', renderWithoutData);
            scope.$on('ui.layout.toggle', renderWithoutData);
            var w = angular.element($window);
            w.bind('resize', renderWithoutData);

            /**
             *  Watch for data changes and re-render
             */
            scope.$watch('data', function (newVals) {
                if (newVals) {
                    renderWithData(newVals);
                }
            }, true);
        }
    };
}]);
