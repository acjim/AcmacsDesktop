'use strict';

angular.module('acjim.comm', ['ngRoute'])

.controller('CommCtrl', ['$scope', '$http', 'mapService', function($scope, $http, mapService) {
/*
    // redirect debug
    $stomp.setDebug(function (args) {
        //console.log(args);
        $scope.log = $scope.log + args + '\n';
    });

    $stomp
        .connect('http://' + window.location.hostname + ':15674/stomp', {
            login: 'guest',
            passcode: 'guest'
        })

        // frame = CONNECTED headers
        .then(function (frame) {

            var subscription = $stomp.subscribe('/queue/draw', function (payload, headers, res) {
                console.log(payload);
                $scope.received = payload.points;
                mapService.prepForBroadcast(payload.points);
            });

            // Unsubscribe
            //subscription.unsubscribe();

            // Send message
            $stomp.send('/queue/upload', {
                readFile: '/points.txt'
            }, {
                priority: 9,
                custom: 42 //Custom Headers
            });

            // Disconnect
            //$stomp.disconnect(function () {});
        });

    $scope.received = 'Debug:';
    $scope.file = '/points.txt';
    $scope.upload = function () {
        $stomp.send('/queue/upload', {
            readFile: $scope.file
        });
    };
*/
}]);