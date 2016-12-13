var path = require('path');
var webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

module.exports = {
    resolve: {
        extensions: ['.ts', '.js', '.html']
    },

    devtool: 'cheap-module-source-map',

    module: {
        rules: [{
            test: /\.js$/,
            loader: 'source-map',
            enforce: 'pre'
        }, {
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
        // fix the warning in ./~/@angular/core/src/linker/system_js_ng_module_factory_loader.js
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
            root('./src')
        ),

        new HtmlWebpackPlugin({
            template: 'index.html',
            chunksSortMode: 'dependency'
        }),
		new CopyWebpackPlugin([
			{ from: 'i18n/', to: 'i18n' }
		]),

        new webpack.optimize.OccurrenceOrderPlugin(true)
    ]
};
