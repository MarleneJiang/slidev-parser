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

# 功能特点 ✨

- 📝 支持 [MDC (Markdown Components)](https://content.nuxtjs.org/guide/writing/mdc) 语法
  - 可以在 Markdown 中直接使用 Vue 组件
  - 支持属性修饰符(例如 `{.text-blue}`）
  - 支持嵌套语法和快捷方式

- 🎨 完整的 [UnoCSS](https://unocss.dev/) 样式支持
  - 原子化 CSS 工具类
  - 支持动态类名
  - 支持预设图标
  - 支持自定义规则和主题

- 📐 内置布局模板
  - default - 默认布局
  - center - 居中布局
  - cover - 封面布局
  - two-cols - 两列布局
  - image-right/left - 图文布局
  - iframe - 内嵌框架布局

- 🔥 高级特性
  - 浏览器端实时渲染
  - 响应式设计
  - 支持缩放
  - 主题定制

# 安装 📦

```bash
# 使用 npm
npm install slidev-parser

# 使用 yarn
yarn add slidev-parser

# 使用 pnpm
pnpm add slidev-parser

```

# 使用指南 📖

## 基础使用

```vue
<script setup>
import { SlideRender } from 'slidev-parser'
import 'slidev-parser/index.css'

const slide = {
  frontmatter: {
    layout: 'cover', // 使用封面布局
  },
  content: `
# 我的演示文稿 {.text-blue-500}

使用 **Markdown** 编写内容
  `,
  note: '这是演讲者注释'
}
</script>

<template>
  <SlideRender
    id="my-slide"
    :slide="slide"
    :zoom="1"
    :slide-aspect="16 / 9"
  />
</template>
```

## 多页面切换

```vue
<script setup>
import { SlidesRender } from 'slidev-parser'
import 'slidev-parser/index.css'

const slides = [
  {
    frontmatter: { layout: 'cover' },
    content: '# 第一页',
  },
  {
    frontmatter: { layout: 'two-cols' },
    content: `
# 左侧内容
::right::
# 右侧内容
    `,
  }
]
</script>

<template>
  <SlidesRender :slides="slides" />
</template>
```

## 配置选项

```ts
interface RendererOptions {
  // Markdown 解析器选项
  mdOptions?: Record<string, any>

  // Vue SFC 编译选项
  sfcOptions?: Record<string, any>

  // UnoCSS 配置
  unoConfig?: {
    customConfigRaw?: string
    customCSSLayerName?: string
  }

  // 自定义加载和错误组件
  SlideLoading?: Component
  SlideError?: Component
}
```
