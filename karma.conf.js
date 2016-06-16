// Karma configuration
// Generated on Wed Dec 02 2015 22:57:01 GMT+0100 (Paris, Madrid)

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            // for Travis
            'node_modules/es6-shim/es6-shim.js',
            'node_modules/zone.js/dist/zone.js',
            'node_modules/zone.js/dist/long-stack-trace-zone.js',
            'node_modules/zone.js/dist/jasmine-patch.js',
            'node_modules/systemjs/dist/system.src.js',
            'node_modules/reflect-metadata/Reflect.js',

            { pattern: 'node_modules/@angular/**/*.js', included: false, watched: false, served: true },
            { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false, served: true },
            { pattern: 'node_modules/systemjs/dist/system-polyfills.js', included: false, watched: false, served: true }, // PhantomJS2 (and possibly others) might require it

            { pattern: 'ng2-translate.ts', included: false, watched: true }, // source files
            { pattern: 'src/**/*.ts', included: false, watched: true }, // source files
            { pattern: 'tests/**/*.ts', included: false, watched: true }, // test files
            'karma-test-shim.js'
        ],

        // list of files to exclude
        exclude: [
            'node_modules/@angular/**/*_spec.js'
        ],

        preprocessors: {
            '**/*.ts': ['typescript']
        },

        typescriptPreprocessor: {
            options: require('./tsconfig.json').compilerOptions,
            typings: [
                "typings/index.d.ts"
            ]
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: process.env.TRAVIS ? ['Firefox'] : ['Firefox', 'Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultanous
        concurrency: Infinity
    })
};
