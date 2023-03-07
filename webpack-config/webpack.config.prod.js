'use strict';

const {merge} = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');

const commonConfig = require('./webpack.config.common');

module.exports = merge(commonConfig, {
    mode: 'production',
    output: {
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[hash].js',
        chunkFilename: '[id].[hash].chunk.js'
    },
    optimization: {
        noEmitOnErrors: true,
        usedExports: true,
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    ecma: 6,
                    compress: {drop_console: true},
                    output: {comments: true}
                }
            })
        ]
    }
});
