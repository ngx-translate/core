var path = require('path');
var webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');

function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

module.exports = {
    resolve: {
        extensions: ['', '.ts', '.js', '.html'],
        root: root('demo'),
        descriptionFiles: ['package.json'],
        modules: [
            root('src'),
            './node_modules'
        ]
    },

    // context: root(),
    debug: true,
    devtool: 'cheap-module-source-map',

    module: {
        preLoaders: [{
            test: /\.js$/,
            loader: 'source-map'
        }],
        loaders: [{
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            exclude: /(node_modules)/
        }]
    },

    entry: {
        'app': './src/bootstrap.ts'
    },

    devServer: {
        outputPath: root('dist'),
        watchOptions: {
            poll: true
        },
        stats: {
            modules: false,
            cached: false,
            colors: true,
            chunks: false
        }
    },

    output: {
        path: root('dist'),
        filename: '[name].[hash].js',
        sourceMapFilename: '[name].[hash].map',
        chunkFilename: '[id].[hash].chunk.js'
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            chunksSortMode: 'dependency'
        }),

        new webpack.optimize.OccurrenceOrderPlugin(true)
    ]
};
