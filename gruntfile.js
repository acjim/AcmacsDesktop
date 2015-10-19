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
        }
    });

    grunt.loadNpmTasks('grunt-nw-builder');

    grunt.registerTask('default', ['nwjs']);
};