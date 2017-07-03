'use strict';

const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
  const site = env.site;

  let siteWebpackConfig;

  try {
    siteWebpackConfig = require(`../src/sites/${site}/webpack.config.js`);
  } catch (ex) {
    siteWebpackConfig = {};
  }

  const webpackConfig = merge({
    entry: {
      app: path.resolve(__dirname, `../src/sites/${site}/main.js`),
    },
    output: {
      path: path.resolve(__dirname, `../dist/static/${site}`),
      publicPath: `/static/${site}/`,
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
              // the "scss" and "sass" values for the lang attribute to the right configs here.
              // other preprocessors should work out of the box, no loader config like this necessary.
              'scss': 'vue-style-loader!css-loader!sass-loader',
              'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            },
            // other vue-loader options go here
          },
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]?[hash]',
          },
        },
      ],
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
      },
    },
    devServer: {
      stats: { colors: true, modules: false, chunks: false },
      // historyApiFallback: true,
      // noInfo: true,
      // setup: (app) => {
      //   // 使用本地模拟数据
      //   app.all('/api/*', (req, res, next) => {
      //     const filename = path.join(__dirname, '../src/json', req.path);

      //     // 避免数据缓存
      //     delete require.cache[`${filename}.json`];
      //     delete require.cache[`${filename}.js`];

      //     res.send(require(filename));
      //   });
      // },
      // proxy: {
      //   // 使用后台提供数据
      //   '/api': {
      //     target: 'http://api.com',
      //     changeOrigin: true,
      //   },
      // },
    },
    performance: {
      hints: false,
    },
    devtool: '#eval-source-map',
  }, siteWebpackConfig);

  if (env.production) {
    webpackConfig.devtool = '#source-map';
    // http://vue-loader.vuejs.org/en/workflow/production.html
    webpackConfig.plugins = (webpackConfig.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        },
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: false,
        },
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, `../src/sites/${site}/index.html`),
        filename: path.resolve(__dirname, `../dist/${env.master ? 'index' : (site + '/index')}.html`),
        hash: true,
      }),
    ]);
  }

  return webpackConfig;
};
