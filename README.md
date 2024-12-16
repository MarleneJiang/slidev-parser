<h1 align="center">slidev-parser</h1>

<p align="center">
The slidev parser for web env.
</p>

<p align="center">
  <a href="https://github.com/MarleneJiang/slidev-parser/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/MarleneJiang/slidev-parser?color=red" alt="license">
  </a>
  <a href="https://github.com/MarleneJiang/slidev-parser/releases">
    <img src="https://img.shields.io/github/v/release/MarleneJiang/slidev-parser?color=purple&include_prereleases" alt="release">
  </a>
  <a href="https://github.com/MarleneJiang/slidev-parser/issues">
    <img src="https://img.shields.io/github/issues/MarleneJiang/slidev-parser.svg?color=lightgreen" alt="issues">
  </a>
  <a href="https://github.com/MarleneJiang/slidev-parser/pulls">
    <img src="https://img.shields.io/github/issues-pr/MarleneJiang/slidev-parser.svg?color=lightgreen" alt="pulls">
  </a>
</p>

<p align="center">
<a href="">📚 Documentation</a> |
<a href="https://stackblitz.com/edit/vitejs-vite-hbatbgm5?file=src%2FApp.vue">🤹‍♂️ Playground</a>
</p>
<br>
# ✨ Features

- 🎨 Full [UnoCSS](https://unocss.dev/) support for styling
- 📝 [MDC (Markdown Components)](https://content.nuxtjs.org/guide/writing/mdc) syntax support
- 📐 Built-in preset layout formatters
- 📦 Compiled in the browser

# 📦 Installation

```bash
# Using npm
npm install slidev-parser

# Using yarn
yarn add slidev-parser

# Using pnpm
pnpm add slidev-parser
```

# Usage

```vue
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
  comp.value = await slides[0]
  updateDynamicCss(css.value)
})
</script>

<template>
  <div v-if="comp">
    <component :is="comp.component" />
  </div>
</template>

<style></style>
```

# License

[MIT](https://github.com/MarleneJiang/slidev-parser/blob/main/LICENSE.md)
