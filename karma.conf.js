// Karma configuration file for running in a headless mode with extensive reports, suitable for GitHub Actions

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-coverage'),
            require('karma-mocha-reporter'),
            require('karma-jasmine-html-reporter'),
            require('@angular-devkit/build-angular/plugins/karma')
        ],
        preprocessors: {
            // Add your source files to be preprocessed with 'coverage'
            '**/src/**/*.ts': ['coverage']
        },
        client: {
            jasmine: {
                // Additional configuration for Jasmine can go here
            },
            clearContext: false // leave Jasmine Spec Runner output visible in browser (not needed for headless)
        },
        coverageReporter: {
            dir: require('path').join(__dirname, './coverage'),
            subdir: '.',
            reporters: [
                { type: 'html' },
                { type: 'lcovonly' }, // for more detailed coverage analysis
                { type: 'text-summary' }
            ]
        },
        reporters: ['progress', 'kjhtml', 'coverage'], // Use mocha for detailed console output
        browsers: ['ChromeNoSearchEngineScreen'],
        customLaunchers: {
            ChromeHeadlessCustom: {
                base: 'ChromeHeadless',
                flags: ['--disable-gpu', '--no-sandbox'] // Recommended for CI environments
            },
            ChromeNoSearchEngineScreen: {
                base: "Chrome",
                flags: ["-disable-search-engine-choice-screen"],
            },
        },
        watch: true,
        restartOnFileChange: false, // Prevent restarting on file changes
    });
};
