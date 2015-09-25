/*
 USAGE:
 To run the test cases, on command line:
 $node_modules/nodeunit/bin/nodeunit test/sample_test.js
 all tests must end with test.done();
 and test.expect() gives number of expected tests.
 */
var sys = require('sys');
var api = require('../app/shared/api.js');
var config = require('./../config.js');
var fs = require('fs');

exports.create_file_path = function (test) {
    test.expect(1);
    var file_path = config.store.path;
    var file_name = './test/data/concentric-circles.acd1';
    var extension = '.json';
    var expected_file_name = file_path + 'concentric-circles' + '_' + api.date_now() + extension;
    //  expected_file_name = ./data/concentric-circles_1442290351652.json
    test.equals(api.create_file_path(file_path, file_name, extension, ''), expected_file_name);
    test.done();
};

exports.extract_name = function (test) {
    test.expect(1);
    var file_name = './test/data/concentric-circles.acd1';
    var expected_file_name = 'concentric-circles';
    test.equals(api.extract_name(file_name), expected_file_name);
    test.done();
};

exports.input_parameter = function (test) {
    test.expect(2); // number of expected tests
    var command = "import";
    var additional_params = {name: 'concentric-circles', parse_antigen_names: false};
    var input_file = './test/data/concentric-circles.acd1';
    var store_path = config.store.temp;
    var expected_file_name = store_path + additional_params.name + '_' + api.date_now() + ".json";
    test.equals(api.create_input_parameter(command, additional_params, input_file), expected_file_name);
    var file_exists = fs.existsSync(expected_file_name);
    test.ok(file_exists);
    fs.unlink(expected_file_name);
    test.done();
};

exports.in_param_get_table = function (test) {
    test.expect(2); // number of expected tests
    // testing input_parameter command as get_table
    var command = "get_table";
    var additional_params = {};
    var store_path = config.store.temp;
    var input_file = './test/data/concentric-circles.acd1';
    var expected_file_name = store_path + 'concentric-circles' + '_' + api.date_now() + ".json";
    test.equals(api.create_input_parameter(command, additional_params, input_file), expected_file_name);
    var file_exists = fs.existsSync(expected_file_name);
    test.ok(file_exists);
    fs.unlink(expected_file_name);

    // test get_table as parameter
    test.done();
}

exports.in_param_get_map = function (test) {
    test.expect(1); // number of expected tests
    // testing input_parameter command as get_map
    var command = "get_map";
    var additional_params = {};
    var store_path = config.store.temp;
    var input_file = './test/data/concentric-circles.acd1';
    var expected_file_name = store_path + 'concentric-circles' + '_' + api.date_now() + ".json";
    test.equals(api.create_input_parameter(command, additional_params, input_file), expected_file_name);
    var file_exists = fs.existsSync(expected_file_name);
    //test.ok(file_exists);
    fs.unlink(expected_file_name);

    // test get_table as parameter
    test.done();
}

exports.import = function (test) {
    test.expect(1);
    var input_file = './test/data/concentric-circles.acd1';
    var expected_file = './data/concentric-circles' + "_" + api.date_now() + ".acd1";
    var output = api.import_user_data(input_file, 'new-open', {});
    var output_file = output.output_acd1;
    // parse file returned from table_filename to get json data related with table. NOTE: this file can only be json.
    var table_filename = output.table_json;
    // parse file returned from map_filename to get json data related with maps. NOTE: this file can only be json.
    var map_filename = output.map_json;
    test.equals(output_file, expected_file);
    var file_exists = fs.existsSync(expected_file);
    console.log(file_exists);
    //test.ok(file_exists);
    test.done();
}

exports.api_exists = function(test)
{
    test.expect(1);
    var path = config.api.path;
    var exists = 1;
    exists = fs.openSync(path,'r');
    test.ok(exists);
    test.done();
}
//temporary test
exports.test_file_exists = function (test) {
    test.expect(1);
    var input_file = './test/data/concentric-circles.acd1';
    var file = "./data/concentric-circles_1442359685352.acd1";
    var file_exists = fs.existsSync(file);
    var output_json = api.get_table_data(input_file, file);
    var expected_file = './data/concentric-circles' + "_table_" + api.date_now() + ".json";
    test.equals(output_json, expected_file);
    test.done();
}

