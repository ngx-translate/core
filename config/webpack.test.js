/**
 * Adapted from angular2-webpack-starter
 */

const helpers = require('./helpers'),
    webpack = require('webpack'),
    LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');

/**
 * Webpack Plugins
 */

module.exports = {

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [helpers.root('src'), 'node_modules']
    },

    module: {
        rules: [{
            enforce: 'pre',
            test: /\.ts$/,
            loader: 'tslint-loader',
            exclude: [helpers.root('node_modules')]
        }, {
            enforce: 'pre',
            test: /\.js$/,
            loader: 'source-map-loader',
            exclude: [
                // these packages have problems with their sourcemaps
                helpers.root('node_modules/rxjs'),
                helpers.root('node_modules/@angular')
            ]
        }, {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            query: {
                // use inline sourcemaps for "karma-remap-coverage" reporter
                sourceMap: false,
                inlineSourceMap: true,
                module: "commonjs",
                removeComments: true
            },
            exclude: [/\.e2e\.ts$/]
        }, {
            enforce: 'post',
            test: /\.(js|ts)$/,
            loader: 'istanbul-instrumenter-loader',
            include: helpers.root('src'),
            exclude: [/\.spec\.ts$/, /\.e2e\.ts$/, /node_modules/]
        }]
    },

    plugins: [
        // fix the warning in ./~/@angular/core/src/linker/system_js_ng_module_factory_loader.js
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)@angular/,
            helpers.root('./src')
        ),

        new LoaderOptionsPlugin({
            debug: true,
            options: {

                /**
                 * Static analysis linter for TypeScript advanced options configuration
                 * Description: An extensible linter for the TypeScript language.
                 *
                 * See: https://github.com/wbuchwalter/tslint-loader
                 */
                tslint: {
                    emitErrors: false,
                    failOnHint: false,
                    resourcePath: 'src'
                }
            }
        })
    ],

    // disable warnings about bundle size for tests
    performance: {hints: false}
};
