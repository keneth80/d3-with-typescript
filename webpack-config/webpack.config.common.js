// const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebPackPlugin      = require('html-webpack-plugin');
const BundleAnalyzerPlugin   = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const helpers = require('./helpers');
 
module.exports = {
    resolve: {
        extensions: ['.js', '.ts']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                // loader: 'url?limit=10000'
                use: 'url-loader'
            },
            {
                test: /\.(txt|csv)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {}
                  }
                ]
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

        // new BundleAnalyzerPlugin()
    ]
};
