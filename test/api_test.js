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
    //fs.unlink(expected_file_name);
    test.done();
};

exports.in_param_get_table = function (test) {
    test.expect(2); // number of expected tests
    // testing input_parameter command as get_table
    var command = "get_table";
    var additional_params = {};
    var expected_file_name = store_path + 'concentric-circles' + '_' + api.date_now() + ".json";
    test.equals(api.create_input_parameter(command, additional_params, input_file), expected_file_name);
    var file_exists = fs.existsSync(expected_file_name);
    test.ok(file_exists);
    fs.unlink(expected_file_name);

    // test get_table as parameter
    test.done();
}

exports.import = function (test) {
    test.expect(1);
    var input_file = './test/data/concentric-circles.acd1';
    var expected_file = './data/concentric-circles' + "_" + api.date_now() + ".acd1";
    var output_file = api.import_user_data(input_file);
    test.equals(output_file, expected_file);
    var file_exists = fs.existsSync(expected_file);
    console.log(file_exists);
    //test.ok(file_exists);
    test.done();
}

exports.get_table = function (test) {
    test.expect(1);
    var input_file = './test/data/concentric-circles.acd1';
    var output_acd1 = api.import_user_data(input_file, 'table');
    var output_json = api.get_table_data(input_file, output_acd1);
    var expected_file = './data/concentric-circles' + "_table_" + api.date_now() + ".json";
    test.equals(output_json, expected_file);
    test.done();
}