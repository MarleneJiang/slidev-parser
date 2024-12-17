<!-- eslint-disable antfu/no-import-dist -->
<script setup>
import { SlideRender } from '../dist/index.es'
import '../dist/index.css'

const slidesSource = [
  {
    frontmatter: {
      layout: 'cover',
    },
    content: `# slidev-parser{.text-blue-500}\n\nSupport \`MDC\`{.font-bold .text-xl},\`UnoCSS\`{.font-bold .text-xl} Syntax.{.mt-5}\n\nCompiled in the **browser**\n\n<div i-logos-vue inline-block text-4xl mr-4/><div i-logos-unocss inline-block text-4xl mr-4/><div i-logos-chrome inline-block text-4xl/>`,
    note: '',
  },
]
</script>

<template>
  <div class="wrapper">
    <SlideRender id="slide" :slide="slidesSource[0]" />
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;
  width: 100%;
}
</style>
