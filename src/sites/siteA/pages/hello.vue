<template>
  <div>
    <p>Hello, {{name}}</p>
  </div>
</template>

<script>
export default {
  beforeRouteEnter(to, from, next) {
    fetch('/api/siteA/hello')
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
