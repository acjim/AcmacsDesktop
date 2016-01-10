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
 * Wrapper directive for the d3 map
 */
app.directive('acMap', function() {
    return {
        restrict: 'A',
        transclude: true,
        scope: {},
        bindToController: {
            map: '=',
            acd1: '='
        },
        controller: 'mapCtrl',
        controllerAs: 'mapData',
        template: '<p class="stressLabel">Stress: {{(d3Data.stress || "Undefined Value") | number: 3}}</p><div d3-map class="fullsize" data="d3Data" lable="title"></div>'
    };
});

/*
 * D3 directive
 */
app.directive('d3Map', ['$rootScope', 'toolbar', 'toolbarItems', function($rootScope, toolbar, toolbarItems) {
    return {
        restrict: 'A',
        scope: {
            data: "=",
            label: "@"
        },
        link: function(scope, iElement) {

            var svg = null,
                width = 0,
                height = 0,
                xScale = null,
                yScale = null,
                zoom = null,
                minimalScaleValue = null,
                translate = [0, 0],
                scale = 1,
                gridTranslate = [0,0],
                gridScale = 1,
                initialScale = 1,
                brush = null,
                visibility = 0,
                dataExtentX = null,
                dataExtentY = null,
                boxSize = 1,
                disableArray =[],
                color="",
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
                    .scaleExtent([minimalScaleValue, 300])
                    .x(xScale)
                    .y(yScale)
                    .translate(translate)
                    .scale(scale)
                    .on("zoom", applyZoom);

                // reapply scales on the data
                nodeGroup.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });
                labelsGroup.attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });

                // Create brush
                brush = createBrush();

                // Create background grid
                boxGroup = redrawGrid(boxGroup, boxSize, width / initialScale, height / initialScale);

                manageMapTools();

            }

            /**
             * Renders the complete d3 map with data
             * @param data
             */
            function renderWithData (data) {

                // checks if the map is drawn the for the first time, adds svg, groups and zoom if necessary
                if (!svg) {
                    initializeSVG();
                }

                renderWithoutData();

                // Enter
                nodeGroup = nodeGroup.data(data.d3Nodes);

                nodeGroup.enter().append("path")
                    .attr("class", "point")
                    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
                    .attr("fill", function(d){
                        // color as string
                        if(_.isArray(d.style.fill_color )) {
                            return d.style.fill_color[0];
                        }else{
                            return d.style.fill_color;
                        }
                    })
                    .attr("fill-opacity", function(d){
                        if(_.isArray(d.style.fill_color)) {
                            return d.style.fill_color[1];
                        }else{
                            return 1;
                        }
                    })
                    .attr("stroke", "#474747")
                    .attr("name", function(d){ return d.name })
                    .attr("label_version", function(d, i){
                        return i;        // slug = label downcased, this works
                    })
                    .attr("d",d3.svg.symbol().size("50")
                        .type(function(d) {
                            if (d.style.shape === "circle") { return "circle"; }
                            else if (d.style.shape === "box") { return "square"; }
                        }));




                // mouse event handlers
                nodeGroup.on("mousedown", function(d) {
                    if (!d.selected) { // Don't deselect on shift-drag.
                        if (!shiftKey) {
                            nodeGroup.classed("selected", function(p) { return p.selected = d === p; });
                        } else {
                            d3.select(this).classed("selected", d.selected = true);
                        }
                    }
                })
                    .on("mouseup", function(d) {
                        if (d.selected && shiftKey) {
                            d3.select(this).classed("selected", d.selected = false);
                        }
                    })

                    .call(d3.behavior.drag()
                        .on("dragstart", function() {
                            d3.event.sourceEvent.stopPropagation();
                        })
                        .on("drag", function() {
                            nudge(d3.event.dx, d3.event.dy);
                        })
                )
                    .attr("opacity", (function(d) { return d.opacity; }));


                if(data.d3Errorlines && data.d3Connectionlines && data.d3Errorlines.length > 1 && data.d3Connectionlines.length > 1){
                    renderErrorlines(data.d3Errorlines, data.d3Connectionlines);
                }
                nodeGroup.exit().remove();

                labelsGroup=labelsGroup.data(data.d3Nodes);
                labelsGroup.enter().append("text")
                    .attr("class", "text")
                    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
                    .attr("x", function(d) {return d.x; })
                    .attr("y", function(d) { return d.y; })
                    .style("visibility","hidden")
                    .style("font-family","sans-serif")
                    .style("font-size","10px")
                    .style("fill","#330066")
                    .text(function(d) {return d.name; });
                labelsGroup.exit().remove();

            }


            /**
             * Renders the additional layers for connection and error lines
             * @param errorline_data, connectionline_data
             */
            function renderErrorlines(errorline_data, connectionline_data){

                // checks if the map is drawn the for the first time, adds svg, groups and zoom if necessary
                if (!svg) {
                    initializeSVG();
                    renderWithData(data);
                }

                // TODO: disable selecting/moving nodes when lines are displayed? Or figure out way to move the respective lines..
                errorlineGroup = errorlineGroup.data(errorline_data);
                errorlineGroup.enter().append("line")
                    .attr("class", "errorline")
                    .attr("x1",(function(d) { return xScale(d.x1); }))
                    .attr("y1",(function(d) { return yScale(d.y1); }))
                    .attr("x2",(function(d) { return xScale(d.x2); }))
                    .attr("y2",(function(d) { return yScale(d.y2); }))
                    //.attr("transform", function(d) { return "translate(" + xScale(d.x1) + "," + yScale(d.y1) + ")"; })
                    .attr("stroke", (function(d) { return d.stroke; } ))
                    .attr("stroke-width", (function(d) { return d.width; }))
                    .attr("opacity", (function(d) { return d.opacity; }));

                connectionlineGroup = connectionlineGroup.data(connectionline_data);
                connectionlineGroup.enter().append("line")
                    .attr("class", "connectionline")
                    .attr("x1",(function(d) { return xScale(d.x1); }))
                    .attr("y1",(function(d) { return yScale(d.y1); }))
                    .attr("x2",(function(d) { return xScale(d.x2); }))
                    .attr("y2",(function(d) { return yScale(d.y2); }))
                    // .attr("transform", function(d) { return "translate(" + xScale(d.x1) + "," + yScale(d.y1) + ")"; })
                    .attr("stroke", (function(d) { return d.stroke; } ))
                    .attr("stroke-width", (function(d) { return d.width; }));

                errorlineGroup.exit().remove();
                connectionlineGroup.exit().remove();

            }

            /**
             * Adds the selected tool functionality to the d3 map
             */
            function manageMapTools() {

                var currentTool = toolbar.getActiveItemFromGroup(toolbarItems.MAP_TOOLS);

                switch(currentTool.id) {
                    case toolbarItems.SELECTION:
                        enableSelectionTool();
                        break;
                    case toolbarItems.MOVEMENT:
                        enableMovementTool();
                        break;
                    default:
                        console.log("Didn't recognize the tool given and did nothing. Could it be that no tool is selected?");
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
                brushGroup.select('.background').style('cursor', '');

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

                // Initialize SVG element
                svg = d3.select(iElement[0])
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%");

                width = getContainerWidth();
                height = getContainerHeight();

                dataExtentX = d3.extent(scope.data.d3Nodes, function(d) { return d.x;});
                dataExtentY = d3.extent(scope.data.d3Nodes, function(d) { return d.y;});

                centerNodes();

                // Add groups in the right order to the svg
                boxGroup = svg.append("g")
                    .attr("transform", "translate(" + gridTranslate + ")scale(" + gridScale + ")");

                brushGroup = svg.append("g")
                    .datum(function () { return {selected: false, previouslySelected: false}; })
                    .attr("class", "brush");

                elementGroup = svg.append("g");

                connectionlineGroup = elementGroup.append("g")
                    .attr("class", "connectionline")
                    .attr("id", "connectionlineLayer")
                    .selectAll(".connectionline");

                errorlineGroup = elementGroup.append("g")
                    .attr("class", "errorline")
                    .attr("id", "errorlineLayer")
                    .selectAll(".errorline");

                nodeGroup = elementGroup.append("g")
                    .attr("class", "node")
                    .selectAll(".node");
                labelsGroup = elementGroup.append("g")
                    .attr("class", "text")
                    .selectAll(".text");


                //better way to set this hidden upon start?
                $('#errorlineLayer').css({'visibility': 'hidden'});
                $('#connectionlineLayer').css({'visibility': 'hidden'});
            }

            /**
             * Creates the brush
             * @returns {d3.svg.brush}
             */
            function createBrush() {
                brush =  d3.svg.brush()
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
                nodeGroup.filter(function(d) { return d.selected; })
                    .attr("transform", function(d) {
                        d.x += dx/zoom.scale();
                        d.y += dy/zoom.scale();
                        return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                    });

                if(d3.event.preventDefault) {
                    d3.event.preventDefault();
                }

                $rootScope.pointsMoved = true;

                if($rootScope.connectionlinesShown || $rootScope.errorlinesShown){
                    $rootScope.$emit('api.nudgeTriggeredErrorlines');
                }
            }

            /**
             * Center the nodes in the middle of the svg
             */
            function centerNodes () {

                var dataWidthX = Math.abs(dataExtentX[1]-dataExtentX[0]),
                    dataWidthY = Math.abs(dataExtentY[1]-dataExtentY[0]);

                // how much larger the drawing area is than the width and the height
                var width_ratio = width / dataWidthX;
                var height_ratio = height / dataWidthY;

                // we need to fit it in both directions, so we scale according to
                // the direction in which we need to shrink the most
                minimalScaleValue = scale = initialScale = gridScale = Math.min(width_ratio, height_ratio) * 0.8;

                // translate so that it's in the center of the window
                translate[0] = -(dataExtentX[0]) * minimalScaleValue + (width - dataWidthX * minimalScaleValue) / 2;
                translate[1] = -(dataExtentY[0]) * minimalScaleValue + (height - dataWidthY * minimalScaleValue) / 2;
            }

            /**
             * Applies the current zoom and moves the objects accordingly.
             * Also caches translate and scale values of the zoom for later use.
             */
            function applyZoom() {

                // Move the grid
                if(d3.event) {
                    gridTranslate = d3.event.translate[0] % (boxSize * d3.event.scale) + "," + d3.event.translate[1] % (boxSize * d3.event.scale);
                    gridScale = d3.event.scale;
                }
                boxGroup.attr("transform",
                    "translate(" + gridTranslate + ")scale(" + gridScale + ")");

                translate = zoom.translate();
                scale = zoom.scale();

                // Move the graph
                nodeGroup.attr("transform", function (d) {
                    return "translate("+xScale(d.x)+", "+yScale(d.y)+")";
                });// Move the text labels
                labelsGroup.attr("transform", function (d) {
                    return "translate("+xScale(d.x)+", "+yScale(d.y)+")";
                });
                errorlineGroup.attr("x1",(function(d) { return xScale(d.x1); }))
                    .attr("y1",(function(d) { return yScale(d.y1); }))
                    .attr("x2",(function(d) { return xScale(d.x2); }))
                    .attr("y2",(function(d) { return yScale(d.y2); }));

                connectionlineGroup.attr("x1",(function(d) { return xScale(d.x1); }))
                    .attr("y1",(function(d) { return yScale(d.y1); }))
                    .attr("x2",(function(d) { return xScale(d.x2); }))
                    .attr("y2",(function(d) { return yScale(d.y2); }));
            }

            /**
             * Redraws/creates only the background grid of the map
             * @param parentContainer d3 container to append the grid to
             * @param boxSize the box size of the grid
             * @param width intended width of the grid
             * @param height intended heiht of the grid
             * @returns parentContainer
             */
            function redrawGrid (parentContainer, boxSize, width, height) {

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

            /** Gets All D3 Selected Elements Without Taking into account sress Value. This function should be called by the button responsible for Disabling nodes without taking
             * into accoun the sress value
             * @returns none
             */
            function DisableSelectedElementsWithoutStress(){
                $rootScope.disableArray=[];
                $rootScope.disableArrayFlag=false;
                var flag=0;
                // Disable Button Functionality
                d3.selectAll(".selected").each(function(d){
                    if (d.style.fill_color != "#bebebe") {
                        flag=1;
                        color=d.style.fill_color;
                        d.style.fill_color = "#bebebe";
                        d3.select(this).transition()
                            .style("stroke", "green")
                            .style("opacity", .4)
                            .attr("style", "fill:#bebebe");
                        disableArray.push(d.id);
                        //console.log(d.id);

                    }
                    else if ("#bebebe"){
                        flag=1;
                        d3.select(this).transition()
                            .attr("style", "fill:"+color);
                        d.style.fill_color = color;
                        for( var c=0; c < disableArray.length; c++){
                            if (d.id== disableArray[c]){
                                disableArray.splice(c, 1);
                                c= c-1;
                            }
                        }
                        flag=1;
                    }
                    else{}
                });

                if (flag===0){
                    alert("Please Select at least One Node Before Clicking on Disable");
                }
                else{
                    $rootScope.disableArrayFlag= true;
                    console.log(disableArray);
                    $rootScope.disableArray= disableArray;
                }
            }

            /** Gets All D3 Selected Elements. This function should be called by the button responsible for Disabling nodes
             * @returns none
             */
            function DisableSelectedElements(){
                $rootScope.disableArray=[];
                $rootScope.disableArrayFlag=false;
                var flag=0;
                // Disable Button Functionality
                d3.selectAll(".selected").each(function(d){
                    if (d.style.fill_color != "#bebebe") {
                        flag=1;
                        color=d.style.fill_color;
                        d.style.fill_color = "#bebebe";
                        d3.select(this).transition()
                            .style("stroke", "green")
                            .style("opacity", .4)
                            .attr("style", "fill:#bebebe");
                        disableArray.push(d.id);
                        //console.log(d.id);

                    }
                    else if ("#bebebe"){
                        flag=1;
                        d3.select(this).transition()
                            .attr("style", "fill:"+color);
                        d.style.fill_color = color;
                        for( var c=0; c < disableArray.length; c++){
                            if (d.id== disableArray[c]){
                                disableArray.splice(c, 1);
                                c= c-1;
                            }
                        }
                        flag=1;
                    }
                    else{}
                });

                if (flag===0){
                    alert("Please Select at least One Node Before Clicking on Disable");
                }
                else{
                    $rootScope.disableArrayFlag= true;
                   // console.log(disableArray);
                    $rootScope.disableArray= disableArray;
                }
            }

            /**
             * Returns the node labels of nodes or removes them depending on the case
             * @returns none
             */
            function GetNodeLabels() {
                if (visibility == 0) {
                    d3.selectAll(".text").style("visibility", "visible");
                    visibility= 1;
                }
                else {
                    d3.selectAll(".text").style("visibility", "hidden");
                    visibility= 0;
                }
            }

            /**
             * Gets a new Map  Selected Elements With Their Respective Data.
             * mapDataPoints should be assigned to scope.data before passing it to the function
             * @returns a Data Array with the new Map Data
             */
            function GetNewDataFromCurrentMap(mapDataPoints) {
                $rootScope.newMapArray=[];
                $rootScope.newMapArrayflag=false;
                var mapArray =[];
                var length= mapDataPoints.d3Nodes.length;
                for(var counter= 0; counter < length;counter++){
                    mapArray.push(counter);
                    $rootScope.newMapArray.push(counter);
                }
                var flag=0;
                d3.selectAll(".selected").each(function(d){
                    flag=1;
                    mapArray.splice(d.id, 1);
                });

                if (flag===0){
                    alert("Please Select at least One Node Before Creating a New Map");
                }
                else{
                    console.log($rootScope.newMapArray.length);
                    console.log(mapArray.length);
                    for(var counter= 0; counter< mapArray.length; counter++){
                        var index = $rootScope.newMapArray.indexOf(mapArray[counter]);
                        $rootScope.newMapArray.splice(index, 1);
                    }
                    console.log(mapArray);
                    console.log($rootScope.newMapArray);
                    $rootScope.newMapArrayflag= true;
                }

            }

            /////////////////////// LISTENERS ///////////////////////

            /**
             * Watches for a node disable while Affecting the Stress Value
             */
            $rootScope.$on('api.set_disconnected_points', function() {
                DisableSelectedElements();
            });

            /**
             * Watches for a node disable while Affecting the Stress Value
             */
            $rootScope.$on('api.set_disconnected_points2', function() {
                DisableSelectedElementsWithoutStress();
            });

            /**
             * Watches to Create  a new Map from Already Existing Map
             */
            $rootScope.$on('newMap.create', function() {
                DisableSelectedElements();
            });

            /**
             * Listens for event to get add/remove node labels
             */

            $rootScope.$on('map.showLabels', function() {
                GetNodeLabels();
            });

            /**
             * Watches for errorline button to show/hide layer and set flag
             */
            $rootScope.$on('api.geterrorlines', function(){
                if ($('#errorlineLayer').css('visibility') === 'hidden'){
                    $('#errorlineLayer').css({'visibility': 'visible'});
                    $rootScope.errorlinesShown = true;
                }else{
                    $('#errorlineLayer').css({'visibility':'hidden'});
                    $rootScope.errorlinesShown = false;
                }
            });

            /**
             * Watches for connectionline button to show/hide layer and set flag
             */
            $rootScope.$on('api.getconnectionlines', function(){
                if ($('#connectionlineLayer').css('visibility') === 'hidden'){
                    $('#connectionlineLayer').css({'visibility': 'visible'});
                    $rootScope.connectionlinesShown = true;
                }else{
                    $('#connectionlineLayer').css({'visibility':'hidden'});
                    $rootScope.connectionlinesShown = false;
                }
            });

            /**
             * Watches for a tool change
             */
            $rootScope.$on('tool.selected', manageMapTools);


            /**
             * Listens for the window resize event and re-renders the map
             */
            scope.$on('ngWindow.resize', renderWithoutData);


            /**
             * Listens for container resize event and re-renders the map
             */
            scope.$on('container-resized', renderWithoutData);


            /**
             *  Watch for data changes and re-render
             */
            scope.$watch('data', function(newVals) {
                renderWithData(newVals);
            }, true);
        }
    };
}]);
