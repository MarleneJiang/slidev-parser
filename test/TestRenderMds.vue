<script setup>
import { renderMds } from 'slidev-parser'
import { onMounted, ref, shallowRef } from 'vue'

const slidesSource = [
  {
    frontmatter: {
      layout: 'default',
    },
    content: `# slidev-parser{.text-blue-500}\n\nSupport \`MDC\`{.font-bold .text-xl},\`UnoCSS\`{.font-bold .text-xl} Syntax.{.mt-5}\n\nCompiled in the **browser**\n\n<div i-logos-vue inline-block text-4xl mr-4/><div i-logos-unocss inline-block text-4xl mr-4/><div i-logos-chrome inline-block text-4xl/>`,
    note: '',
  },
]

const comp = shallowRef()
const css = ref()
function updateDynamicCss(css) {
  // 创建一个 <style> 标签来插入 CSS
  let style = document.getElementById('dynamic-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'dynamic-style'
    style.type = 'text/css' // 设置 type 为 'text/css'
    document.head.appendChild(style)
  }

  // 设置新的 CSS 内容
  style.innerHTML = css
}
onMounted(async () => {
  const slides = renderMds(slidesSource)
  css.value = (await slides[0].css()).output.css
  comp.value = slides[0]
  updateDynamicCss(css.value)
})
</script>

<template>
  <div v-if="comp">
    <component :is="comp.component" />
  </div>
</template>

<style></style>
