<h1 align="center">slidev-parser</h1>

<p align="center">
A powerful browser-side parser and renderer for Slidev presentations, enabling real-time MDC syntax rendering and UnoCSS styling.
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
<a target="_blank" href="https://stackblitz.com/edit/vitejs-vite-hbatbgm5?file=src%2FApp.vue">🤹‍♂️ Playground</a>
</p>
<br>

# Features ✨

- 📝 [MDC (Markdown Components)](https://content.nuxtjs.org/guide/writing/mdc) Support
  - Use Vue components directly in Markdown
  - Property modifiers support (e.g. `{.text-blue}`)
  - Nested syntax and shortcuts

- 🎨 Full [UnoCSS](https://unocss.dev/) Integration
  - Atomic CSS utilities
  - Dynamic class names
  - Preset icons support
  - Custom rules and theming

- 📐 Built-in Layout Templates
  - default - Standard layout
  - center - Centered content
  - cover - Cover slide
  - two-cols - Two-column layout
  - image-right/left - Image with text
  - iframe - Embedded frame layout

- 🔥 Advanced Features
  - Browser-side real-time rendering
  - Responsive design
  - Zoom support
  - Theme customization

# Installation 📦

```bash
# Using npm
npm install slidev-parser

# Using yarn
yarn add slidev-parser

# Using pnpm
pnpm add slidev-parser
```

# Usage Guide 📖

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

## Configuration Options

```ts
interface RendererOptions {
  // Markdown parser options
  mdOptions?: Record<string, any>

  // Vue SFC compilation options
  sfcOptions?: Record<string, any>

  // UnoCSS configuration
  unoConfig?: {
    customConfigRaw?: string
    customCSSLayerName?: string
  }

  // Custom loading and error components
  SlideLoading?: Component
  SlideError?: Component
}
```
