// Turn on full stack traces in errors to help debugging
Error.stackTraceLimit=Infinity;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

// Cancel Karma's synchronous start,
// we will call `__karma__.start()` later, once all the specs are loaded.
__karma__.loaded = function() {};

System.config({
    baseURL: '/base/',
    defaultJSExtensions: true,
    map: {
        '@angular': 'node_modules/@angular',
        'rxjs': 'node_modules/rxjs'
    },
    packages: {
        '@angular/core': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        '@angular/http': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        '@angular/compiler': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        '@angular/common': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser-dynamic': {
            main: 'index.js',
            defaultExtension: 'js'
        },
        'rxjs': {
            defaultExtension: 'js'
        }
    }
});

Promise.all([
    System.import('@angular/core/testing'),
    System.import('@angular/platform-browser-dynamic/testing')
]).then(function (providers) {
    var testing = providers[0];
    var testingBrowser = providers[1];

    testing.setBaseTestProviders(testingBrowser.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
        testingBrowser.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);

}).then(function() {
    // Finally, load all spec files.
    // This will run the tests directly.
    return Promise.all(
        Object.keys(window.__karma__.files) // All files served by Karma.
            .filter(onlySpecFiles)
            .map(file2moduleName)
            .map(function(path) {
                return System.import(path).then(function(module) {
                    if (module.hasOwnProperty('main')) {
                        module.main();
                    } else {
                        throw new Error('Module ' + path + ' does not implement main() method.');
                    }
                });
            }));
    })
    .then(function() {
        __karma__.start();
    }, function(error) {
        console.error(error.stack || error);
        __karma__.start();
    });


function onlySpecFiles(path) {
    return /[\.|_]spec\.js$/.test(path);
}

// Normalize paths to module names.
function file2moduleName(filePath) {
    return filePath.replace(/\\/g, '/')
        .replace(/^\/base\//, '')
        .replace(/\.js/, '');
}