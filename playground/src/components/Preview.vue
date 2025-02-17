<!-- eslint-disable antfu/no-import-dist -->
<script setup>
import { SlideRenderer, SlidesRender } from '@/index'
import { computed } from 'vue'
import { inputMDC } from '../composables/url'
import CustomComp from './CustomComp.vue'
import SlideBottom from './SlideBottom.vue'

const rendererOptions = {
  components: {
    CustomComp,
  },
}
const inputSlides = computed(() => SlideRenderer.parse(inputMDC.value))
</script>

<template>
  <div class="wrapper">
    <SlidesRender
      id="slide" :slides="inputSlides" :renderer-options="rendererOptions"
    >
      <template #slide-bottom="{ index }">
        <SlideBottom :current-slide-route="{ no: index }" />
      </template>
    </SlidesRender>
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;
  width: 100%;
  overflow: auto;
}

/* 新增自定义滚动条样式 */
.wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.wrapper::-webkit-scrollbar-corner {
  background-color: var(--cm-ttc-c-track);
}

.wrapper::-webkit-scrollbar-thumb {
  background-color: var(--cm-ttc-c-thumb);
  border-radius: 3px;
  border: 2px solid var(--cm-ttc-c-thumb);
}

.wrapper::-webkit-scrollbar-track {
  background: var(--cm-ttc-c-track);
}
</style>
