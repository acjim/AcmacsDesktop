module.exports = function(grunt) {

    var isWin = /^win/.test(process.platform);
    var isMac = /^darwin/.test(process.platform);
    var isLinux = /^linux/.test(process.platform);
    var arch = process.arch === 'x64' ? '64' : '32';

    var platforms = [];

    if (grunt.option('platform')) {
        platforms.push(grunt.option('platform'));
    } else {
        if (isMac) platforms.push('osx' + arch);
        if (isWin) platforms.push('win' + arch);
        if (isLinux) platforms.push('linux' + arch);
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('src/package.json'),
        clean: {
            options: { force: true },
            build: ["./build"],
            package: ["./publish"]
        },
        nwjs: {
            options: {
                version: "0.12.3",
                platforms: platforms,
                buildDir: './build', // Where the build version of my NW.js app is save
                macZip: true,
                macIcns: './assets/osx/icon.icns'

            },
            src: './src/**/*'
        },
        appdmg: {
            options: {
                basepath: __dirname,
                title: '<%= pkg.name %>',
                icon: 'assets/osx/icon.icns',
                credits: 'assets/osx/credits.html',
                background: 'assets/osx/background.png',
                'icon-size': 80,
                contents: [
                    {x: 448, y: 344, type: 'link', path: '/Applications'},
                    {x: 192, y: 344, type: 'file', path: 'build/AcmacsDesktop/osx' + arch + '/AcmacsDesktop.app'}
                ]
            },
            target: {
                dest: 'publish/<%= pkg.name %>.dmg'
            }
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
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-appdmg');

    // Build the app for osx
    grunt.registerTask('build', ['clean:build', 'nwjs']);

    var packageFlow = ['build', 'clean:package'];
    if(isMac) packageFlow.push('appdmg');

    grunt.registerTask('package', packageFlow);

    // Unit testint in development mode
    grunt.registerTask('devmode', ['karma:unit', 'watch']);

    // Task for travisCI
    grunt.registerTask('test', ['karma:travis']);

};