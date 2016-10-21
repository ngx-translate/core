/**
 * Adapted from angular2-webpack-starter
 */

const helpers = require('./config/helpers'),
    webpack = require('webpack');

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');

module.exports = {
    devtool: 'inline-source-map',

    resolve: {
        extensions: ['.ts', '.js']
    },

    entry: helpers.root('ng2-translate.ts'),

    output: {
        path: helpers.root('bundles'),
        publicPath: '/',
        filename: 'index.js',
        libraryTarget: 'umd',
        library: 'ng2-translate'
    },

    // require those dependencies but don't bundle them
    externals: [/^\@angular\//, /^rxjs\//],

    module: {
        rules: [{
            enforce: 'pre',
            test: /\.ts$/,
            loader: 'tslint',
            exclude: [helpers.root('node_modules')]
        }, {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            exclude: [/\.e2e\.ts$/]
        }]
    },

    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                tslintLoader: {
                    emitErrors: false,
                    failOnHint: false
                }
            }
        })
    ]
};
