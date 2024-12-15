import type { MarkdownTransformContext, SlideInfo } from '@slidev/types'
import type { UnpluginOptions } from 'unplugin'
import type { CompileResult } from '../types'
import MagicString from 'magic-string-stack'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMdc from 'markdown-it-mdc'
import { unpluginFactory } from 'unplugin-vue-markdown'
import { regexSlideSourceId } from '../configs/common'
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

const transformers = [
] as any[]

function createPlugin(slidesInfo: SlideInfo[], mdOptions: any) {
  return unpluginFactory({
    include: [/\.md$/],
    wrapperClasses: '',
    headEnabled: false,
    frontmatter: false,
    escapeCodeTagInterpolation: false,
    markdownItOptions: {
      quotes: '""\'\'',
      html: true,
      xhtmlOut: true,
      linkify: true,
      ...mdOptions?.markdownItOptions,
    },
    ...mdOptions,
    async markdownItSetup(md) {
      md.use(MarkdownItFootnote)
      md.use(MarkdownItMdc)
      await mdOptions?.markdownItSetup?.(md)
    },
    transforms: {
      ...mdOptions?.transforms,
      before(code, id) {
        code = mdOptions?.transforms?.before?.(code, id) ?? code
        const match = id.match(regexSlideSourceId) // file name like /slides.md__slidev_0.md
        if (!match)
          return code

        const s = new MagicString(code)
        const ctx: MarkdownTransformContext = {
          s,
          slide: slidesInfo[+match[1]],
          options: {
            data: {
              config: {
                monaco: true,
              },
            },
          } as any,
        }

        for (const transformer of transformers) {
          if (!transformer)
            continue
          transformer(ctx)
          if (!ctx.s.isEmpty())
            ctx.s.commit()
        }

        return s.toString()
      },
    },
  }, {
    framework: 'vite',
  }) as UnpluginOptions
}

export async function compileCss(options: CompileOptions) {
  const { slidesInfo, mdOptions, code, filename } = options
  const plugin = createPlugin(slidesInfo, mdOptions)
  const vueSFC = (await (plugin.transform?.call({
    error: console.error,
  } as any, code, filename)) as any).code // 转换成sfc代码，不包含style
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
  const { slidesInfo, mdOptions, code, filename } = options
  const plugin = createPlugin(slidesInfo, mdOptions)
  let vue = (await (plugin.transform?.call({
    error: console.error,
  } as any, code, filename)) as any).code // 转换成sfc代码，不包含style
  const layoutWrapperPlugin = createlayoutWrapperTransform(slidesInfo, layouts)
  // @ts-expect-error missing types
  vue = layoutWrapperPlugin.transform!.call({} as any, vue, filename) // 传入预制代码，载入布局
  return vue
}

export async function compileMd(options: CompileOptions): Promise<CompileResult> {
  const { sfcOptions = {}, filename } = options
  const vue = await compileVueSFC(options) // sfc
  const vueObj = await compileVue(filename, vue, sfcOptions) // 编译成对象：js代码和css代码
  return vueObj
}
