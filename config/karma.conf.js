module.exports = function(config) {
    var testWebpackConfig = require('./webpack.test.js');

    var configuration = {
        basePath: '',

        frameworks: ['jasmine'],

        // list of files to exclude
        exclude: [ ],

        /*
         * list of files / patterns to load in the browser
         *
         * we are building the test environment in ./spec-bundle.js
         */
        files: [ { pattern: './config/spec-bundle.js', watched: false } ],

        preprocessors: { './config/spec-bundle.js': ['coverage', 'webpack', 'sourcemap'] },

        // Webpack Config at ./webpack.test.js
        webpack: testWebpackConfig,

        coverageReporter: {
            dir : 'coverage/',
            reporters: [
                { type: 'text-summary' },
                { type: 'json' },
                { type: 'html' }
            ]
        },

        // Webpack please don't spam the console when running in karma!
        webpackServer: { noInfo: true },

        reporters: [ 'mocha', 'coverage' ],

        // web server port
        port: 9876,

        colors: true,

        /*
         * level of logging
         * possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
         */
        logLevel: config.LOG_INFO,

        autoWatch: false,

        browsers: [
            'Chrome'
        ],

        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },

        singleRun: true
    };

    if(process.env.TRAVIS){
        configuration.browsers = ['Chrome_travis_ci'];
    }

    config.set(configuration);
};