const path = require('path');

const express = require('express');
const gulp = require('gulp');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const sites = Object.keys(require('./package.json').sitesVersion);
const getSiteWebpackConfig = require('./webpack.config.js');

gulp.task('dev', () => {
  const app = express();
  const port = 8080;

  sites.forEach((site, siteIndex) => {
    const webpackConfig = getSiteWebpackConfig({ site });
    const compiler = webpack(webpackConfig);

    // 使用本地模拟数据
    app.all('/api/*', (req, res) => {
      const filename = path.join(__dirname, 'src/json', req.path);

      // 避免数据缓存
      delete require.cache[`${filename}.json`];
      delete require.cache[`${filename}.js`];

      res.send(require(filename));
    });

    app.use(webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
      noInfo: true,
      stats: 'errors-only',
    }));

    const isMasterSite = siteIndex === 0;

    app.get(isMasterSite ? '/' : `/${site}/*`, (req, res) => {
      res.sendFile(path.join(__dirname, `src/sites/${site}/index.html`));
    });
  });

  app.listen(port, () => {
    console.log(`[静态服务器启动],端口: ${port}`); // eslint-disable-line no-console
  });
});
