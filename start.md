# 使用Vue从零开始搭一个大型CMS

### 从Hello World开始
**[第一步](https://github.com/smadey/vue-cms/tree/step1)**，安装 [vue-cli](https://github.com/vuejs/vue-cli)，执行如下命令生成一个项目
```bash
vue init webpack-simple vue-cms
```
##### 说明
> **vue-cli:** 是 `Vue`的官方的脚手架，使用它能快速搭建一个`Vue`项目

**[第二步](https://github.com/smadey/vue-cms/tree/step2)**，加入本地数据模拟功能或直接请求后台数据
```javascript
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
}
```
##### 说明
> **模拟数据:** 指模拟后台提供数据，这样前后端可以并行开发

**[第三步](https://github.com/smadey/vue-cms/tree/step3)**，引入 [vue-router](https://github.com/vuejs/vue-router)， 新增页面(进入页面之前使用 [fetch](https://github.com/github/fetch) 获取数据)
```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';
import Hello from './pages/hello.vue';
// import World from './pages/world.vue';
const World = resolve => require(['./pages/world.vue'], resolve); // 按需加载页面

Vue.use(VueRouter);

new Vue({
  el: '#app',
  router: new VueRouter({
    mode: 'history',
    routes: [
      { path: '/hello', component: Hello },
      { path: '/world', component: World },
    ],
    scrollBehavior() {
      return { x: 0, y: 0 };
    },
  }),
  render: h => h(App),
});
```
```xml
<template>
  <div id="app">
    <router-link to="/">
      <h1>{{title}}</h1>
    </router-link>

    <div>
      <router-link to="/hello">Hello</router-link>
      <router-link to="/world">World</router-link>
    </div>

    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </div>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {
      title: 'Vue CMS',
    };
  },
};
</script>

<style lang="scss">
...
</style>
```
```xml
<template>
  <div>
    <p>Hello, {{name}}</p>
  </div>
</template>

<script>
export default {
  beforeRouteEnter(to, from, next) {
    fetch('/api/hello')
      .then(response => response.json())
      .then((result) => {
        next((vm) => {
          vm.name = result.name;
        });
      })
  },
  data () {
    return {
      name: '',
    };
  },
};
</script>
```
至此，一个可以随意新增页面的框架出来了，随着业务的增加，页面会越来越多，合适的按需加载即可应付。

### 如何适应多业务线？
当业务线增加，并且多个业务线之间并无业务关联时，**拆分子站**是一种不错的选择。每一个业务线为一个子站，都有一个承载的html文件，所有的子站的入口放在一个主站中，这样也和传统的多页面模式有点类似。
##### 拆分子站的优势
> **高效率：**不容易出现因为业务太多到导致启动或打包速度太慢的问题
> **低耦合：**各个业务彻底解藕，迭代、维护、甚至重构都可以完全独立
> **易扩展：**很容易接入新的业务线

##### 如何拆分子站？
**第一步**，调整目录结构，配置子站版本号
```json
{
  "name": "vue-cms",
  "description": "A Vue.js project",
  "version": "1.0.0",
  "sitesVersion": {
    "siteMaster": "1.0.0",
    "siteA": "1.0.0",
    "siteB": "1.0.0"
  },
  ...
}
```
**第二步**，调整 `webpack.config.js`
```javascript
'use strict';

const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');

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
    ...
  }, siteWebpackConfig);

  if (env.production) {
    ...
  }

  return webpackConfig;
};

```
**第三步**，引入`gulp`，配置`gulpfile.js`
```javascript
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

  // 使用本地模拟数据
  app.all('/api/*', (req, res) => {
    const filename = path.join(__dirname, './src/json', req.path);

    // 避免数据缓存
    delete require.cache[`${filename}.json`];
    delete require.cache[`${filename}.js`];

    res.send(require(filename));
  });

  sites.forEach((site, siteIndex) => {
    const webpackConfig = getSiteWebpackConfig({ site });
    const compiler = webpack(webpackConfig);

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
```
[就这样](https://github.com/smadey/vue-cms/tree/step4)，一个个子站被拆分开，然而，效率并没有高起来，多个子站还是串行全部编译。
**第四步**，调整`gulpfile.js`(用**子进程**编译、用**`http-proxy-middleware`**代理编译之后的文件)
```javascript
const spawn = require('child_process').spawn;
const path = require('path');

const bins = {
  'webpack': absolute('../node_modules/webpack/bin/webpack'),
  'webpack-dev-server': absolute('../node_modules/webpack-dev-server/bin/webpack-dev-server'),
};

module.exports = (script) => {
  const args = script.split(' ').map(arg => bins[arg] || arg);
  const child = spawn('node', [webpackDevServerBin].concat(args));

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  process.once('SIGINT', () => process.exit(0));
  process.once('exit', () => child.kill());
};
```
```javascript
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
    ...
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
```
**第五步**，使用 `html-webpack-plugin` 生成引用编译后模块的 html 文件
``` xml
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>vue-cms</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- <% if (false) { %> -->
    <!-- 只在开发阶段加载的JS，build 时由 html-webpack-plugin 移除 -->
    <script src="/static/siteMaster/app.js"></script>
    <!-- <% } %> -->
  </body>
</html>
```
```javascript
module.exports = (env) => {
  const site = env.site;
  ...

  const webpackConfig = ...;

  if (env.production) {
    ...
    webpackConfig.plugins = (webpackConfig.plugins || []).concat([
      ...
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, `../src/sites/${site}/index.html`),
        filename: path.resolve(__dirname, `../dist/${env.master ? 'index' : (site + '/index')}.html`),
        hash: true,
      }),
    ]);
  }

  return webpackConfig;
};
```
```javascript
gulp.task('build', () => {
  sites.forEach((site) => {
    const isMasterSite = allSites.indexOf(site) === 0;

    // 调用子进程编译
    npmRun(`webpack --config ${webpackConfigFilename} ${isMasterSite ? '--env.master' : ''} --env.production --env.site=${site}`);
  });
});
```
[到这里](https://github.com/smadey/vue-cms/tree/step5)，一个基于Vue的大型CMS后台的架子已经搭好了，后面就是愉快的coding了。
