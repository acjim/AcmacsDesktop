(function() {
    'use strict';

    var config = require('./config.js'),
        fs = require('fs');

    angular.module('AcmacsDesktop')
        .controller('appCtrl', ['$scope', 'nwService', 'fileDialog', appCtrl]);

    function appCtrl($scope, nwService, fileDialog) {

        var win = nwService.window;
        var openWindows = 0;

        $scope.recentProjects = [];

        var docWindowOptions = {
            show: true,
            "new-instance": false,
            "toolbar": false,
            "width": 800,
            "height": 600
        };

        $scope.openDocumentWindow = function (filename) {
            win.hide();
            openWindows++;
            nwService.gui.Window.open('window.html?filename=' + encodeURIComponent(filename), docWindowOptions);
        };


        $scope.openFile = function () {
            fileDialog.openFile(
                $scope.openDocumentWindow,
                false,
                '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz'
            );
        };

        win.focus();

        /**************** AngularJS listeners ***************/

        $scope.$on('open-file', $scope.openFile);


        // Open Debug Window
        $scope.$on('open-debug', function () {
            nwService.window.showDevTools();
        });


        /**************** nw.js listeners ***************/

        win.on("openFileInNewWindow", function (filename) {
            $scope.openDocumentWindow(filename);
        });


        win.on("window-close", function (windowID) {

            var store_path = config.store.path;
            var data_path = store_path + windowID + '/';

            cleanWindowData(data_path);

            if (--openWindows === 0) {
                win.show();
                win.focus();
            }

        });

    }

    function cleanWindowData(dirPath) {
        try {
            var files = fs.readdirSync(dirPath);

            if (files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var filePath = dirPath + '/' + files[i];
                    if (files[i] !== '.gitkeep') {
                        if (fs.statSync(filePath).isFile()) {
                            fs.unlinkSync(filePath);
                        } else {
                            cleanWindowData(filePath);
                        }
                    }
                }
            }
            fs.rmdirSync(dirPath);
        } catch (e) {
            console.log(e);
        }
    }

})();