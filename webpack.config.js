'use strict';

const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');

module.exports = (env) => {
  const site = env.site;

  let siteWebpackConfig;

  try {
    siteWebpackConfig = require(`./src/sites/${site}/webpack.config.js`);
  } catch (ex) {
    siteWebpackConfig = {};
  }

  const webpackConfig = merge({
    entry: {
      app: `./src/sites/${site}/main.js`,
    },
    output: {
      path: path.resolve(__dirname, `./dist/${site}`),
      publicPath: `/dist/${site}/`,
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
      historyApiFallback: true,
      noInfo: true,
      setup: (app) => {
        // 使用本地模拟数据
        app.all('/api/*', (req, res, next) => {
          const filename = path.join(__dirname, 'src/json', req.path);

          // 避免数据缓存
          delete require.cache[`${filename}.json`];
          delete require.cache[`${filename}.js`];

          res.send(require(filename));
        });
      },
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

  if (process.env.NODE_ENV === 'production') {
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
    ]);
  }

  return webpackConfig;
};
