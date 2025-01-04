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
  <div>
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
    content: `# slidev-parser{.text-blue-500}\n\nSupport \`MDC\`{.font-bold .text-xl},\`UnoCSS\`{.font-bold .text-xl} Syntax.{.mt-5}\n\nCompiled in the **browser**\n\n<div i-logos-vue inline-block text-4xl mr-4/><div i-logos-unocss inline-block text-4xl mr-4/><div i-logos-chrome inline-block text-4xl/> <remote url="https://gist.githubusercontent.com/MarleneJiang/b205007f50abcbc404f07127439c686a/raw/05414d8f57cf7d0af626200f73feb19d01d79619/test.vue"/>\n<CustomComp/>`,
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
