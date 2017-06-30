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
      { path: '/siteA/hello', component: Hello },
      { path: '/siteA/world', component: World },
    ],
    scrollBehavior() {
      return { x: 0, y: 0 };
    },
  }),
  render: h => h(App),
});
