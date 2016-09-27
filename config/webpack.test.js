/**
 * Adapted from angular2-webpack-starter
 */

const helpers = require('./helpers');

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');

const ENV = process.env.ENV = process.env.NODE_ENV = 'test';

module.exports = {

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',


    resolve: {
        extensions: ['', '.ts', '.js'],
        root: helpers.root('')
    },

    module: {

        preLoaders: [
            {
                test: /\.ts$/,
                loader: 'tslint-loader',
                exclude: [helpers.root('node_modules')]
            },
            {
                test: /\.js$/,
                loader: 'source-map-loader',
                exclude: [
                    // these packages have problems with their sourcemaps
                    helpers.root('node_modules/rxjs'),
                    helpers.root('node_modules/@angular')
                ]
            }
        ],

        loaders: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader',
                query: {
                    compilerOptions: {

                        // Remove TypeScript helpers to be injected
                        // below by DefinePlugin
                        removeComments: true
                    }
                },
                exclude: [/\.e2e\.ts$/]
            }
        ],

        postLoaders: [
            {
                test: /\.(js|ts)$/, loader: 'istanbul-instrumenter-loader',
                include: helpers.root('src'),
                exclude: [
                    /\.(e2e|spec)\.ts$/,
                    /node_modules/
                ]
            }
        ]
    },

    plugins: [
        new DefinePlugin({
            'ENV': JSON.stringify(ENV),
            'process.env': {
                'ENV': JSON.stringify(ENV)
            }
        })
    ],

    tslint: {
        emitErrors: false,
        failOnHint: false,
        resourcePath: 'src'
    },


    node: {
        global: 'window',
        process: false,
        crypto: 'empty',
        module: false,
        clearImmediate: false,
        setImmediate: false
    }

};