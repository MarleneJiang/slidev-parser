<h1 align="center">slidev-parser</h1>

<p align="center">
强大的 Slidev 浏览器端解析渲染器，支持实时 MDC 语法渲染和 UnoCSS 样式处理。
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
<a target="_blank" href="./README.md">English</a>  |
<a target="_blank" href="./README_CN.md">简体中文</a>  |
<a target="_blank" href="https://stackblitz.com/edit/slidev-parser-demo">🤹‍♂️ Demo</a> |
<a target="_blank" href="https://slidev-parser.vercel.app">🚀 Playground</a>
</p>
<br>

# Features ✨

- 📝 **Markdown 增强**
  - [MDC语法](https://content.nuxtjs.org/guide/writing/mdc)支持
  - Vue 组件直接集成
  - 样式修饰符 (如 `{.text-blue}`)
  - 语法嵌套与快捷方式

- 🎨 **UnoCSS 支持**
  - [原子化CSS](https://unocss.dev/)工具集
  - 动态类名生成
  - 图标预设集成
  - 自定义规则与主题

- 🧩 **组件生态**
  - 远程组件动态加载
  - 自定义组件注入
  - 组件实时热更新
  - 完整生命周期管理

- 📐 **布局模板**
  - `default` - 标准布局
  - `center` - 居中布局
  - `cover` - 封面布局
  - `two-cols` - 双栏布局
  - `image-right/left` - 图文布局
  - `iframe` - 框架布局

- 🔥 **高级特性**
  - 浏览器端实时渲染
  - 响应式设计适配
  - 缩放控制支持
  - 主题深度定制
  - 组件热重载

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

## Basic Usage

```vue
<script setup>
import { SlideRender } from 'slidev-parser'
import 'slidev-parser/index.css'

const slide = {
  frontmatter: {
    layout: 'cover', // Use cover layout
  },
  content: `
# My Presentation {.text-blue-500}

Content written in **Markdown**
  `,
  note: 'Speaker notes here'
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

## Multiple Slides

```vue
<script setup>
import { SlidesRender } from 'slidev-parser'
import 'slidev-parser/index.css'

const slides = [
  {
    frontmatter: { layout: 'cover' },
    content: '# First Page',
  },
  {
    frontmatter: { layout: 'two-cols' },
    content: `
# Left Content
::right::
# Right Content
    `,
  }
]
</script>

<template>
  <SlidesRender :slides="slides" />
</template>
```

## 远程动态组件

```vue
<script setup>
import { SlideRender } from 'slidev-parser'
import 'slidev-parser/index.css'

const slide = {
  frontmatter: {
    layout: 'cover',
  },
  content: `
# My Presentation

<remote url="https://gist.githubusercontent.com/MarleneJiang/b205007f50abcbc404f07127439c686a/raw/05414d8f57cf7d0af626200f73feb19d01d79619/test.vue"/>
  `,
  note: 'Speaker notes here'
}
</script>

<template>
  <SlideRender
    id="my-slide"
    :slide="slide"
  />
</template>
```

## 自定义组件

```vue
<script setup>
import { SlideRender } from 'slidev-parser'
import CustomComp from './CustomComp.vue'
import 'slidev-parser/index.css'

const slide = {
  frontmatter: {
    layout: 'cover',
  },
  content: `
# My Presentation

<CustomComp/>
  `,
  note: 'Speaker notes here'
}
</script>

<template>
  <SlideRender
    id="my-slide"
    :slide="slide"
  />
</template>
```

## 配置项

```ts
interface BaseConfigOptions {
  mdOptions?: Record<string, any>
  sfcOptions?: Record<string, any>
  components?: Record<string, Component>
}
export interface RendererOptions extends BaseConfigOptions {
  unoConfig?: {
    customConfigRaw?: string
    customCSSLayerName?: string
    uno?: boolean
  }
  SlideLoading?: Component
  SlideError?: Component
}
```
