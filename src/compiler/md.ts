import type { SlideInfo } from '@slidev/types'
import type { CompileCssOptions, CompileOptions, CompileResult } from '../types'
import MarkdownIt from 'markdown-it'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMdc from 'markdown-it-mdc'
import { createBuiltInCompWrapperPlugin, createCustomCompWrapperPlugin } from '../runtime/compWrapper'
import { createLayoutWrapperPlugin } from '../runtime/layoutWrapper'
import { layouts } from '../runtime/moduleLoad'
import { generateUnoCss } from './uno'
import { extractTemplateBody } from './utils'
import { compileVue } from './vue'
// import '@slidev/theme-seriph/styles/index'

const mdParser = new MarkdownIt({ quotes: '""\'\'', html: true, xhtmlOut: true, linkify: true })
mdParser.use(MarkdownItFootnote)
mdParser.use(MarkdownItMdc)

function parseMd(code: string) {
  return `<template><div>${mdParser.render(code)}</div></template>
<script setup>
</script>`
}

export async function compileCss(options: CompileCssOptions) {
  const { code, unoGenerator } = options
  const vueSFC = parseMd(code) // 转换成sfc代码，不包含style
  if (!unoGenerator) {
    const unocss = await generateUnoCss({ inputHtml: extractTemplateBody(vueSFC) })
    return unocss
  }
  else {
    const unocss = await unoGenerator.generate({ inputHtml: extractTemplateBody(vueSFC) })
    return unocss
  }
}

function createlayoutWrapperTransform(slidesInfo: SlideInfo[], layouts: Record<string, any>) {
  return createLayoutWrapperPlugin({
    data: {
      get slides() {
        return slidesInfo
      },
    },
    utils: {
      getLayouts() {
        return Object.fromEntries(
          Object.keys(layouts).map(i => [i, `slidev-layouts:${i}`]),
        )
      },
    },
  } as any)
}

export async function compileVueSFC(options: CompileOptions) {
  const { slidesInfo, code, filename, components } = options
  let vueSFC = parseMd(code) // 转换成sfc代码，不包含style
  const layoutWrapperPlugin = createlayoutWrapperTransform(slidesInfo, layouts)
  vueSFC = layoutWrapperPlugin.transform!.call({} as any, vueSFC, filename) || vueSFC // 传入预制代码，载入布局
  // 处理自定义组件
  if (components) {
    const customCompPlugin = createCustomCompWrapperPlugin(components)
    vueSFC = customCompPlugin.transform!(vueSFC) || vueSFC
  }
  vueSFC = createBuiltInCompWrapperPlugin().transform!(vueSFC) || vueSFC // 传入内置组件
  return vueSFC
}

export async function compileMd(options: CompileOptions): Promise<CompileResult> {
  const { sfcOptions = {}, filename } = options
  const vueSFC = await compileVueSFC(options) // sfc
  const vueObj = await compileVue(filename, vueSFC, sfcOptions) // 编译成对象：js代码和css代码
  return vueObj
}
