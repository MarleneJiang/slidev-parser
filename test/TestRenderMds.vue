<!-- eslint-disable antfu/no-import-dist -->
<script setup>
import { SlideRender } from '../src/index'
import CustomComp from './CustomComp.vue'
import '../dist/index.css'

const rendererOptions = {
  sfcComponents: {
    CustomComp: `<script lang="ts" setup>

<\/script>

<template>
  <div class="bg-blue-200 p-4">
    我是自定义组件22😄
  </div>
<\/template>

<style>

<\/style>
`,
  },
}
const slidesSource = [
  {
    frontmatter: {
      layout: 'default',
    },
    content: `  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-8">
    <div class="grid grid-cols-3 gap-6">
      <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center mb-4">
          <i class="i-carbon-document text-white text-2xl mr-2"></i>
          <h2 class="text-white text-xl font-semibold">技术文档的可视化</h2>
        </div>
        <p class="text-white/80">将复杂的技术文档转化为易于理解的图表和卡片。</p>
      </div>
      <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center mb-4">
          <i class="i-carbon-idea text-white text-2xl mr-2"></i>
          <h2 class="text-white text-xl font-semibold">保持专业性</h2>
        </div>
        <p class="text-white/80">在简化内容的同时，确保专业术语和关键信息的准确性。</p>
      </div>
      <CustomComp/>
    </div>
  </div>`,
    note: '',
  },
]
</script>

<template>
  <div class="wrapper">
    <SlideRender id="slide" :slide="slidesSource[0]" :renderer-options="rendererOptions" />
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;
  width: 100%;
}
</style>
