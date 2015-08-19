'use strict';

var app = angular.module('acjim.app',[]);

app.controller('appCtrl', ['$scope', 'nwService', function($scope, nwService) {
    $scope.$on('open-debug', function(e, menu, item) {
        nwService.gui.Window.get().showDevTools();
    });

    $scope.$on('reload-app', function(e, menu, item) {
        if (location)
            location.reload();
    });
}]);

var contentEditor = app; //angular.module("acjim.contentEditor", []);

function placeNode(node, top, left) {
    node.css({
        position: "absolute",
        top: top + "px",
        left: left + "px"
    });
}

// To create a empty resizable and draggable box
contentEditor.directive("ceBoxCreator", function($document, $compile) {
    return {
        restrict: 'E',
        scope: '=',
        link: function($scope, $element, $attrs) {
            angular.element(document).ready( function() {
                var newNode = $compile('<div class="contentEditorBox" ce-drag ce-resize>{{$scope.data}}<ac-table ng-show="showTable"></ac-table><ac-map ng-show="showMap"></ac-map></div>')($scope);
                placeNode(newNode, 150, 150);
                angular.element($document[0].body).append(newNode);
            });
        }
    }
});

// To manage the drag
contentEditor.directive("ceDrag", function($document) {
    return function($scope, $element, $attr) {
        var startX = 0,
            startY = 0;

        var newElement = angular.element('<div class="draggable"></div>');

        $element.append(newElement);
        newElement.on("mousedown", function($event) {
            event.preventDefault();

            // To keep the last selected box in front
            angular.element(document.querySelectorAll(".contentEditorBox")).css("z-index", "0");
            $element.css("z-index", "1");

            startX = $event.pageX - $element[0].offsetLeft;
            startY = $event.pageY - $element[0].offsetTop;
            $document.on("mousemove", mousemove);
            $document.on("mouseup", mouseup);
        });

        function mousemove($event) {
            placeNode( $element , $event.pageY - startY , $event.pageX - startX );
        }

        function mouseup() {
            $document.off("mousemove", mousemove);
            $document.off("mouseup", mouseup);
        }
    };
});

// To manage the resizers
contentEditor.directive("ceResize", function($document) {
    return function($scope, $element, $attr) {
        //Reference to the original
        var $mouseDown;

        // Function to manage resize up event
        var resizeUp = function($event) {
            var margin = 50,
                lowest = $mouseDown.top + $mouseDown.height - margin,
                top = $event.pageY > lowest ? lowest : $event.pageY,
                height = $mouseDown.top - top + $mouseDown.height;

            $element.css({
                top: top + "px",
                height: height + "px"
            });
        };

        // Function to manage resize right event
        var resizeRight = function($event) {
            var margin = 50,
                leftest = $element[0].offsetLeft + margin,
                width = $event.pageX > leftest ? $event.pageX - $element[0].offsetLeft : margin;

            $element.css({
                width: width + "px"
            });
        };

        // Function to manage resize down event
        var resizeDown = function($event) {
            var margin = 50,
                uppest = $element[0].offsetTop + margin,
                height = $event.pageY > uppest ? $event.pageY - $element[0].offsetTop : margin;

            $element.css({
                height: height + "px"
            });
        };

        // Function to manage resize left event
        function resizeLeft ($event) {
            var margin = 50,
                rightest = $mouseDown.left + $mouseDown.width - margin,
                left = $event.pageX > rightest ? rightest : $event.pageX,
                width = $mouseDown.left - left + $mouseDown.width;

            $element.css({
                left: left + "px",
                width: width + "px"
            });
        };

        var createResizer = function createResizer( className , handlers ){

            var newElement = angular.element( '<div class="' + className + '"></div>' );
            $element.append(newElement);
            newElement.on("mousedown", function($event) {

                $document.on("mousemove", mousemove);
                $document.on("mouseup", mouseup);

                //Keep the original event around for up / left resizing
                $mouseDown = $event;
                $mouseDown.top = $element[0].offsetTop;
                $mouseDown.left = $element[0].offsetLeft
                $mouseDown.width = $element[0].offsetWidth;
                $mouseDown.height = $element[0].offsetHeight;

                function mousemove($event) {
                    event.preventDefault();
                    for( var i = 0 ; i < handlers.length ; i++){
                        handlers[i]( $event );
                    }
                }

                function mouseup() {
                    $document.off("mousemove", mousemove);
                    $document.off("mouseup", mouseup);
                }
            });
        };

        createResizer( 'sw-resize' , [ resizeDown , resizeLeft ] );
        createResizer( 'ne-resize' , [ resizeUp   , resizeRight ] );
        createResizer( 'nw-resize' , [ resizeUp   , resizeLeft ] );
        createResizer( 'se-resize' , [ resizeDown ,  resizeRight ] );
        createResizer( 'w-resize' , [ resizeLeft ] );
        createResizer( 'e-resize' , [ resizeRight ] );
        createResizer( 'n-resize' , [ resizeUp ] );
        createResizer( 's-resize' , [ resizeDown ] );
    };

});