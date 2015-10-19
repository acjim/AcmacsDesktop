module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('src/package.json'),
        nwjs: {
            options: {
                version: "0.12.3",
                // specifiy what to build
                platforms: ['osx32'],
                buildDir: './build', // Where the build version of my NW.js app is save
                macZip: true

            },
            src: './src/**/*'
        },
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                background: true
            },
            travis: {
                configFile: 'test/karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            }
        },
        watch: {
            karma: {
                files: ['src/**/*.js', 'test/unit/**/*.js'],
                tasks: ['karma:unit:run']
            }
        }
    });

    grunt.loadNpmTasks('grunt-nw-builder');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');

    // Build the app for osx
    grunt.registerTask('build', ['nwjs']);

    // Unit testint in development mode
    grunt.registerTask('devmode', ['karma:unit', 'watch']);

    // Task for travisCI
    grunt.registerTask('test', ['karma:travis'])
};