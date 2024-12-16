import type { SlideInfo } from '@slidev/types'
import type { CompileResult } from '../types'
import MarkdownIt from 'markdown-it'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMdc from 'markdown-it-mdc'
import { layouts } from '../configs/module'
import { createLayoutWrapperPlugin } from '../runtime/layoutWrapper'
import { generateUnoCss } from './uno'
import { extractTemplateBody } from './utils'
import { compileVue } from './vue'
// import '@slidev/theme-seriph/styles/index'

interface CompileOptions {
  slidesInfo: SlideInfo[]
  filename: string
  code: string
  mdOptions?: Record<string, any>
  sfcOptions?: Record<string, any>
}

const mdParser = new MarkdownIt({ quotes: '""\'\'', html: true, xhtmlOut: true, linkify: true })
mdParser.use(MarkdownItFootnote)
mdParser.use(MarkdownItMdc)

function parseMd(code: string) {
  return `<template><div>${mdParser.render(code)}</div></template>
<script setup>
</script>`
}

export async function compileCss(options: CompileOptions) {
  const { code } = options
  const vueSFC = parseMd(code) // 转换成sfc代码，不包含style
  const unocss = await generateUnoCss({ inputHtml: extractTemplateBody(vueSFC) })
  return unocss
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

async function compileVueSFC(options: CompileOptions) {
  const { slidesInfo, code, filename } = options
  let vueSFC = parseMd(code) // 转换成sfc代码，不包含style
  const layoutWrapperPlugin = createlayoutWrapperTransform(slidesInfo, layouts)
  vueSFC = layoutWrapperPlugin.transform!.call({} as any, vueSFC, filename) || vueSFC // 传入预制代码，载入布局
  return vueSFC
}

export async function compileMd(options: CompileOptions): Promise<CompileResult> {
  const { sfcOptions = {}, filename } = options
  const vueSFC = await compileVueSFC(options) // sfc
  const vueObj = await compileVue(filename, vueSFC, sfcOptions) // 编译成对象：js代码和css代码
  return vueObj
}