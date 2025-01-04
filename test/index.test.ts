import { describe, expect, it } from 'vitest'
import { compileVueSFC, generateUnoCss, SlideRenderer } from '../src/index'

describe('slide compiler css', async () => {
  const slidesSource = [
    {
      frontmatter: {
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
  const slidesData = renderer.parse(`<div class="p-4 bg-red rounded">

# 23423{.text-xl .text-blue}


::remote{url="http://127.0.0.1:7000/api/component/181212ac-342c-40b9-9da3-f8d14f708881"}

#title
Default slot text

#desc
This will be rendered in
::


</div>`)
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
<div class="p-4 bg-red rounded">
<h1 class="text-xl text-blue">23423</h1>
<remote url="http://127.0.0.1:7000/api/component/181212ac-342c-40b9-9da3-f8d14f708881">
<template #title="">
<p>Default slot text</p>
</template>
<template #desc="">
<p>This will be rendered in</p>
</template>
</remote>
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
