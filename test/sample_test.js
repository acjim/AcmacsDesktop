/*
USAGE:
To run the test cases, on command line:
$node_modules/nodeunit/bin/nodeunit test/sample_test.js
all tests must end with test.done();
and test.expect() gives number of expected tests.
 */
var api = require('../app/shared/api.js');

exports.create_file = function (test) {
    test.expect(1); // number of expected tests
    var file_name = '../test/data/concentric-circles.acd1';
    var expected_name = 'concentric-circles.json';
    test.equals(api.createMapFile(file_name), expected_name);
    test.done();

};

exports.test_name = function (test) {
    test.equals(true, true);
    test.done();
};