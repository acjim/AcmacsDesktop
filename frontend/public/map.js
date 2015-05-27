'use strict';

angular.module('acjim.map', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/map', {
        templateUrl: 'map/map.html',
        controller: 'CanvasCtrl'
    });
}])

.controller('MapCtrl', ['$scope', '$http', 'mapService', function($scope, $httd, mapService) {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    $scope.$on('handleBroadcast', function () {
        var lines, lineNumber, data, length;

        lines = mapService.message.match(/[^\r\n]+/g);
        lineNumber = 0;

        for (var i = lines.length - 1; i >= 0; i--) {

            var l = lines[i];
            lineNumber++;
            data = l.split(/,/);

            var id = 0;
            if($scope.data.length > 0) {
                id = $scope.data[$scope.data.length-1].id + 1;
            }
            var p = {id: id, x: data[0], y: data[1], amount: data[2]};
            $scope.data.push(p);
            $scope.x = '';
            $scope.y = '';
            $scope.amount = '';
            draw($scope.data);
        }

    });


    $scope.data = [

    ];

    $scope.addData = function() {
        var id = 0;
        if($scope.data.length > 0) {
            id = $scope.data[$scope.data.length-1].id + 1;
        }
        var p = {id: id, x: $scope.x, y: $scope.y, amount: $scope.amount};
        $scope.data.push(p);
        $scope.x = '';
        $scope.y = '';
        $scope.amount = '';
        draw($scope.data);
    };

    $scope.removePoint = function(point) {
        console.log(point);
        for(var i=0; i<$scope.data.length; i++) {
            if($scope.data[i].id === point.id) {
                console.log("removing item at position: "+i);
                $scope.data.splice(i, 1);
            }
        }

        context.clearRect(0,0,600,400);
        draw($scope.data);
        console.log($scope.data);
    }

    function draw(data) {
        for(var i=0; i<data.length; i++) {
            drawDot(data[i]);
            if(i > 0) {
                drawLine(data[i], data[i-1]);
            }
        }
    }

    function drawDot(data) {
        context.beginPath();
        context.arc(data.x, data.y, data.amount, 0, 2*Math.PI, false);
        context.fillStyle = "#ccddff";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "#666666";
        context.stroke();
    }

    function drawLine(data1, data2) {
        context.beginPath();
        context.moveTo(data1.x, data1.y);
        context.lineTo(data2.x, data2.y);
        context.strokeStyle = "black";
        context.stroke();
    }

    // setup
    canvas.width = 600;
    canvas.height = 400;
    context.globalAlpha = 1.0;
    context.beginPath();
    draw($scope.data);
}])
