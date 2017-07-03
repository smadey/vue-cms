const path = require('path');

const express = require('express');
const gulp = require('gulp');
const gutil = require('gulp-util');

const getPort = require('get-port');
const proxy = require('http-proxy-middleware');
const webpack = require('webpack');

const allSites = Object.keys(require('../package.json').sitesVersion);
const sites = gutil.env.sites === 'all' ? allSites : (gutil.env.sites || '').split(',').filter(site => allSites.indexOf(site) > -1);

const npmRun = require('./npm-run.js');
const webpackConfigFilename = path.join(__dirname, './webpack.config.js');

gulp.task('dev', () => {
  const app = express();
  const port = 8080;

  // 使用本地模拟数据
  app.all('/api/*', (req, res) => {
    const filename = path.join(__dirname, '../src/json', req.path);

    // 避免数据缓存
    delete require.cache[`${filename}.json`];
    delete require.cache[`${filename}.js`];

    res.send(require(filename));
  });

  sites.forEach((site) => {
    getPort().then((sitePort) => {
      // 调用子进程编译
      npmRun(`webpack-dev-server --config ${webpackConfigFilename} --colors --hot --port=${sitePort} --env.site=${site}`);
      // 代理编译之后的文件
      app.use(`/static/${site}`, proxy(`http://localhost:${sitePort}`));
    });

    const isMasterSite = allSites.indexOf(site) === 0;

    app.get(isMasterSite ? '/' : `/${site}/*`, (req, res) => {
      res.sendFile(path.join(__dirname, `../src/sites/${site}/index.html`));
    });
  });

  app.listen(port, () => {
    console.log(`[静态服务器启动],端口: ${port}`); // eslint-disable-line no-console
  });
});

gulp.task('build', () => {
  sites.forEach((site) => {
    const isMasterSite = allSites.indexOf(site) === 0;

    // 调用子进程编译
    npmRun(`webpack --config ${webpackConfigFilename} ${isMasterSite ? '--env.master' : ''} --env.production --env.site=${site}`);
  });
});
