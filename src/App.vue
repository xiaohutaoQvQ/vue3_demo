<template>
  <div class="app">
    <HtmlList/>
    <!-- <Game2048/> -->
  </div>
</template>

<script lang="ts">
import HtmlList from './components/HtmlList.vue';
// import Game2048 from './components/2048_game.vue'
  export default {
    name:'App', //组件名
    components: {
      HtmlList
      // ,
      // Game2048
    }
  }
</script>

<style>

</style>
