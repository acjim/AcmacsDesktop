// to use nconf check nconf documentation and
// for example use this: http://code.runnable.com/Ve4mUV6JXP1uW9sg/-learning-using-nconf-file-config-node-js
// nconf looks only relevant if you want to merge different config objects @current implementation looks neat

/*
 USAGE:
 var config = require('./config.js');
 config.server_name
 */


var config = {}

config.store = {};
config.debug = {};
config.api = {};

config.server_name =  'ACJIM';
config.api.location = '/Users/rohan/Desktop/';
config.api.file = '';
config.store.path = './data/';
config.store.temp = './data/tmp/';
config.api.script = './core/AcmacsCore.bundle/bin/c2env api-acjim.py ';
// if this file_path doesn't exist, and environment is development
config.api.path = './core/AcmacsCore.bundle/';

module.exports = config;