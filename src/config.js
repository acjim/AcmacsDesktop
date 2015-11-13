// to use nconf check nconf documentation and
// for example use this: http://code.runnable.com/Ve4mUV6JXP1uW9sg/-learning-using-nconf-file-config-node-js
// nconf looks only relevant if you want to merge different config objects @current implementation looks neat

/*
 USAGE:
 var config = require('./config.js');
 config.server_name
 */

var config = {};
var gui = window.require('nw.gui');
var datapath = gui.App.dataPath;
var execPath = process.execPath;

config.store = {};
config.dev_mode = 1;
config.debug = {};
config.api = {};

config.server_name =  'ACJIM';
config.api.location = '/vagrant/';
config.api.file = '';
config.store.path = datapath+'/Local_Data/';

if(config.dev_mode === 0 && process.platform === 'linux'){
    config.api.script = execPath + '/core/AcmacsCore.bundle/bin/c2env';
} else {
    config.api.script = '../core/AcmacsCore.bundle/bin/c2env';
}

config.api.params = [];
config.api.params[0] = "api-acjim.py";

module.exports = config;