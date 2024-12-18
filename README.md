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
<a target="_blank" href="https://stackblitz.com/edit/slidev-parser-demo">🤹‍♂️ Playground</a>
</p>
<br>

# Features ✨

- 📝 **Enhanced Markdown**
  - Full [MDC](https://content.nuxtjs.org/guide/writing/mdc) support
  - Seamless Vue component integration
  - Style modifiers (e.g. `{.text-blue}`)
  - Nested syntax and shortcuts

- 🎨 **UnoCSS Integration**
  - [Atomic CSS](https://unocss.dev/) utilities
  - Dynamic class generation
  - Icon preset support
  - Custom rules & theming

- 🧩 **Component System**
  - Remote component loading
  - Custom component injection
  - Real-time component updates
  - Full lifecycle management

- 📐 **Layout Templates**
  - `default` - Standard layout
  - `center` - Centered content
  - `cover` - Cover slide
  - `two-cols` - Two-column layout
  - `image-right/left` - Image with text
  - `iframe` - Embedded frame

- 🔥 **Advanced Features**
  - Browser-side rendering
  - Responsive design
  - Zoom controls
  - Theme customization
  - Hot component reload

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

## Remote Components

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

## Custom Components

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

## Configuration Options

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
