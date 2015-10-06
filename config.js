// to use nconf check nconf documentation and
// for example use this: http://code.runnable.com/Ve4mUV6JXP1uW9sg/-learning-using-nconf-file-config-node-js
// nconf looks only relevant if you want to merge different config objects @current implementation looks neat

/*
 USAGE:
 var config = require('./config.js');
 config.server_name
 */


var config = {};

config.store = {};
config.debug = {};
config.api = {};

config.server_name =  'ACJIM';
config.api.location = '/vagrant/';
config.api.file = '';
config.store.path = './data/';
config.store.temp = './data/tmp/';
if(process.platform == "win32") {
 config.store.projectRoot = "C:\\Users\\Felix\\Dropbox\\www\\acjim\\";
 config.api.script = 'vagrant';
 // if this file_path doesn't exist, and environment is development
 config.api.path = '/vagrant/core/';
 config.api.params = [];
 config.api.params[0] = "ssh";
 config.api.params[1] = "-c";
 config.api.params[2] = "cd /vagrant/ && /acjim/AcmacsCore.bundle/bin/c2env api-acjim.py ";
}else{
 config.api.script = './core/AcmacsCore.bundle/bin/c2env';
 // if this file_path doesn't exist, and environment is development
 config.api.path = './core/AcmacsCore.bundle/';

 config.api.params = [];
 config.api.params[0] = "api-acjim.py";
}

module.exports = config;