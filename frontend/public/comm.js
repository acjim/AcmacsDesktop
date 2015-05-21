'use strict';

angular.module('acjim.comm', ['ngRoute'])

.controller('CommCtrl', ['$scope', '$http', function($scope) {

    var pipe = function (el_name, send) {
        var div = $(el_name + ' div');
        var inp = $(el_name + ' input');
        var form = $(el_name + ' form');

        var print = function (m, p) {
            p = (p === undefined) ? '' : JSON.stringify(p);
            div.append($("<code>").text(m + ' ' + p));
            div.scrollTop(div.scrollTop() + 10000);
        };

        /*if (send) {
            form.submit(function () {
                send(inp.val());
                inp.val('/map.txt');
                return false;
            });
        }*/
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
    $scope.client.connect('guest', 'guest', $scope.on_connect, $scope.on_error, '/');
}]);