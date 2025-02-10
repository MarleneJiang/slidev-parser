<!-- eslint-disable antfu/no-import-dist -->
<script setup>
import { SlideRenderer, SlidesRender } from '@/index'
import { computed } from 'vue'
import { inputMDC } from '../composables/url'
import CustomComp from './CustomComp.vue'

const rendererOptions = {
  components: {
    CustomComp,
  },
}
const inputSlides = computed(() => SlideRenderer.parse(inputMDC.value))
</script>

<template>
  <div class="wrapper">
    <SlidesRender id="slide" :slides="inputSlides" :renderer-options="rendererOptions" />
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;
  width: 100%;
}
</style>
