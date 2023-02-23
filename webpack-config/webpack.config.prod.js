'use strict';

const {merge} = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const cssnano = require('cssnano');

const commonConfig = require('./webpack.config.common');
const helpers = require('./helpers');

module.exports = merge(commonConfig, {
    mode: 'production',
    output: {
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[hash].js',
        chunkFilename: '[id].[hash].chunk.js'
    },

    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        },
        runtimeChunk: 'single',
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                terserOptions: {
                    warnings: false,
                    compress: {
                        warnings: false,
                        unused: true
                    },
                    ecma: 6,
                    mangle: true,
                    unused: true
                },
                sourceMap: true
            })
        ]
    }
});
