'use strict';

angular.module('acjim.comm', ['ngRoute'])

.controller('CommCtrl', ['$scope', '$http', '$stomp', function($scope, $http, $stomp) {

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
            });

            // Unsubscribe
            //subscription.unsubscribe();

            // Send message
           /* $stomp.send('/queue/upload', {
                readFile: '/points.txt'
            }, {
                priority: 9,
                custom: 42 //Custom Headers
            });*/

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
/*
    var pipe = function (el_name, send) {
        var div = $(el_name + ' div');
        var inp = $(el_name + ' input');
        var form = $(el_name + ' form');

        var print = function (m, p) {
            p = (p === undefined) ? '' : JSON.stringify(p);
            div.append($("<code>").text(m + ' ' + p));
            div.scrollTop(div.scrollTop() + 10000);
        };

        return print;
    };
    var print_first = pipe('#first', function(data) {
        $scope.client.send('/queue/upload', {"content-type":"text/plain"}, data);
    });

    // Stomp.js boilerplate
    var ws = new SockJS('http://' + window.location.hostname + ':15674/stomp');
    $scope.client = Stomp.over(ws);

    // SockJS does not support heart-beat: disable heart-beats
    $scope.client.heartbeat.outgoing = 0;
    $scope.client.heartbeat.incoming = 0;
    $scope.client.debug = pipe('#second');

    $scope.received = 'Debug:';
    $scope.file = '/map.txt';

    $scope.upload = function () {
        $scope.client.send('/queue/upload', {"content-type": "text/plain"}, $scope.file);
    };

    $scope.on_connect = function () {
        $scope.client.subscribe("/queue/draw", function (d) {
            $scope.received = d.body; //no idea why this dont work
            var doc = JSON.parse(d.body);
            //draw(doc);
        });
    };
    $scope.on_error = function () {
        console.log('error');
    };
    $scope.client.connect('guest', 'guest', $scope.on_connect, $scope.on_error, '/');*/
}]);