import { describe, expect, it } from 'vitest'
import { compileVueSFC, generateUnoCss, SlideRenderer } from '../src/index'

describe('slide compiler css', async () => {
  const slidesSource = [
    {
      frontmatter: {
        pureHTML: false,
      },
      content: `# Hello\n\nThis is a slide{.mt-5}\n\nCompiled in the **browser**\n::card
  The content of the card{style="color: green;" .custom-class .green}!
  ::\n<test/>`,
      note: '',
    },
  ]
  const renderer = new SlideRenderer()
  const slides = await renderer.render(slidesSource)
  const slide = slides[0]
  it('exported', async () => {
    expect((await slide.css()).output?.css).toEqual(`/* layer: preflights */
*,::before,::after{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}
/* layer: default */
.mt-5{margin-top:1.25rem;}`)
  })
})

describe('unocss generate', async () => {
  const output = await generateUnoCss({ inputHtml: `<div><h1 class="mt-5">Hello</h1>
<p>This is a slide</p>
<p>Compiled in the <strong>browser</strong></p>
<card><span style="color: green;" class="custom-class green"><span style="color: green;" class="custom-class green">The content of the card</span></span>!</card>
<test/></div>` })
  it('exported', () => {
    expect(output.output?.getLayer()).toEqual(`/* layer: default */
.mt-5{margin-top:1.25rem;}`)
  })
})

describe('vue sfc generate', async () => {
  const renderer = new SlideRenderer()
  const slidesData = SlideRenderer.parse(`  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-8">
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


    </div>
  </div>
`)
  const output = await compileVueSFC({
    slidesInfo: renderer.getSlidesInfo(slidesData),
    code: slidesData[0].content,
    filename: '__slidev_0.md',
  })
  // eslint-disable-next-line no-console
  console.log(output)
  it('exported', () => {
    expect(output).toEqual(`<template>
<InjectedLayout v-bind="$frontmatter">
<div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-8">
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
<pre><code>&lt;/div&gt;
</code></pre>
  </div>
</InjectedLayout>
</template>

<script setup>
import remote from "built-in:remote"

import InjectedLayout from "/@fs/slidev-layouts:default"
const $frontmatter = {}

</script>`)
  })
})
