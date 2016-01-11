(function() {
    'use strict';

    var config = require('./config.js'),
        fs = require('fs');

    angular.module('AcmacsDesktop')
        .controller('appCtrl', ['$scope', 'nwService', 'fileDialog', 'appMenuService', appCtrl]);

    function appCtrl($scope, nwService, fileDialog, appMenuService) {

        var win = nwService.window,
            gui = nwService.gui,
            openWindows = 0;

        appMenuService.setMinimalMenu();



        $scope.recentProjects = [];


        $scope.openDocumentWindow = function (filename) {

            if (++openWindows === 1) {
                appMenuService.createNormalMenu();
                win.hide();
            }

            nwService.gui.Window.open(
                'window.html?filename=' + encodeURIComponent(filename),
                {
                    show: true,
                    "new-instance": false,
                    "toolbar": false,
                    "width": 800,
                    "height": 600
                }
            );

        };


        $scope.openFile = function () {
            fileDialog.openFile(
                $scope.openDocumentWindow,
                false,
                '.xls,.xlsx,.txt,.save,.acd1,.acd1.bz2,.acd1.xz,.acp1,.acp1.bz2,.acp1.xz'
            );
        };

        win.focus();

        if(config.dev_mode) {
            $scope.openDocumentWindow("../test/data/test.save")
        }

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

            if (--openWindows === 0) {
                win.show();
                win.focus();
                appMenuService.setMinimalMenu();
            }

            cleanWindowData(data_path);

        });

        win.on('close', function(windowID) {
            cleanWindowData(config.store.path);
            gui.App.quit();
        });


    }

    function cleanWindowData(dirPath) {
        try {
            var files = fs.readdirSync(dirPath);

            if (files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var filePath = dirPath + '/' + files[i];
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    } else {
                        cleanWindowData(filePath);
                    }
                }
            }
            if(dirPath !== config.store.path) {
                fs.rmdirSync(dirPath);
            }
        } catch (e) {
            console.log(e);
        }
    }

})();