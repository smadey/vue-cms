# 从零开始搭一个大型CMS

### 前言
1. 前端框架当然是目前最热门的 **Vue**
2. 建议采用**前后端分离**，数据通过`http`请求获取

### CMS的Hello World
**[第一步]()**，安装 [vue-cli](https://github.com/vuejs/vue-cli)，执行如下命令生成一个项目
```bash
vue init webpack-simple vue-cms
```
##### 说明
> **vue-cli:** 是 `Vue`的官方的脚手架，使用它能快速搭建一个`Vue`项目


**[第二步]()**，加入本地数据模拟功能或直接请求后台数据
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

**[第三步]()**，引入 [vue-router](https://github.com/vuejs/vue-router)， 新增页面(进入页面之前使用 [fetch](https://github.com/github/fetch) 获取数据)
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

<style lang="scss">
</style>
```
**至此，一个可以随意新增页面的框架出来了，随着业务的增加，页面会越来越多，按需加载是一种解决方案。但是当业务达到一定程度，特别是业务之间相互独立的时候，这种结构会越来越臃肿，解决方案之一是子站拆分**

### 大型的CMS是怎么构成的

