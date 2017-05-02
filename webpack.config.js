/**
 * Adapted from angular2-webpack-starter
 */

const helpers = require('./config/helpers'),
    webpack = require('webpack'),
    CleanWebpackPlugin = require('clean-webpack-plugin');

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');

module.exports = {
    devtool: 'inline-source-map',

    resolve: {
        extensions: ['.ts', '.js']
    },

    entry: helpers.root('index.ts'),

    output: {
        path: helpers.root('bundles'),
        publicPath: '/',
        filename: 'core.umd.js',
        library: 'ngx-translate-core',
        libraryTarget: 'umd'
    },

    // require those dependencies but don't bundle them
    externals: [/^\@angular\//, /^rxjs\//],

    module: {
        rules: [{
            enforce: 'pre',
            test: /\.ts$/,
            loader: 'tslint-loader',
            exclude: [helpers.root('node_modules')]
        }, {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            options: {
                declaration: false
            },
            exclude: [/\.spec\.ts$/]
        }]
    },

    plugins: [
        // fix the warning in ./~/@angular/core/src/linker/system_js_ng_module_factory_loader.js
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)@angular/,
            helpers.root('./src')
        ),

        new webpack.LoaderOptionsPlugin({
            options: {
                tslintLoader: {
                    emitErrors: false,
                    failOnHint: false
                }
            }
        }),

        // Reference: https://github.com/johnagan/clean-webpack-plugin
        // Removes the bundle folder before the build
        new CleanWebpackPlugin(['bundles'], {
            root: helpers.root(),
            verbose: false,
            dry: false
        })
    ]
};
