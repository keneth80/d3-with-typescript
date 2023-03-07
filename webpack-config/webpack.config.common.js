// const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const helpers = require('./helpers');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        app: './src/main.ts'
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'inline-source-map',
    devServer: {
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }
            },
            {
                test: /\.js$/,
                // exclude: /node_modules/,
                exclude: [/\bcore-js\b/, /\bwebpack\/buildin\b/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        sourceType: 'unambiguous',
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: './src/index.html',
            filename: './index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../src/component/mock-data'),
                    to: path.resolve(__dirname, '../dist/component/mock-data')
                },
                {
                    from: path.resolve(__dirname, '../src/assets/css'),
                    to: path.resolve(__dirname, '../dist/assets/css')
                },
                {
                    from: path.resolve(__dirname, '../src/assets/image'),
                    to: path.resolve(__dirname, '../dist/assets/image')
                }
            ]
        }),

        new webpack.HotModuleReplacementPlugin()
    ]
};
