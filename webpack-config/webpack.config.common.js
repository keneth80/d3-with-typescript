const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const helpers = require('./helpers');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        app: './src/index.ts'
    },
    output: {
        asyncChunks: true,
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].js',
        libraryTarget: 'commonjs2',
        environment: {
            module: true
        }
    },
    resolve: {
        extensions: ['.js', '.ts', '...']
    },
    devtool: 'inline-source-map',
    devServer: {
        writeToDisk: true
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
                test: /\.(js)x?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/plugin-transform-typescript']
                    }
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            root: helpers.root(),
            verbose: true
        }),
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
