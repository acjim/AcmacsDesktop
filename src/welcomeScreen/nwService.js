(function() {
    'use strict';

    angular.module('AcmacsDesktop')
        .factory('nwService', [nwService]);

    function nwService() {

        // Load native UI library
        var gui = require('nw.gui'),
            win = gui.Window.get();

        return {
            gui: gui,
            window: win
        };

        ////////////////////

    }
})();