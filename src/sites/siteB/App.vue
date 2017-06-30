<template>
  <div id="app">
    <a href="/">返回</a>
    <router-link to="/siteB/">
      <h1>{{title}}</h1>
    </router-link>

    <div>
      <router-link to="/siteB/hello">Hello</router-link>
      <router-link to="/siteB/world">World</router-link>
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
      title: 'Vue CMS Site B',
    };
  },
};
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
