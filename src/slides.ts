import type { Component } from 'vue'
import type { GenerateOutput } from './compiler/uno'
import type { RendererOptions, SlideInfo, SlideRoute, SlideSource, SourceSlideInfo } from './types'
import { parseSync } from '@slidev/parser'
import { defineAsyncComponent } from 'vue'
import { compileCss, compileMd } from './compiler/md'
import { renderNote } from './compiler/note'
import { UnoGenerator } from './compiler/uno'
import SlideError from './components/SlideError.vue'
import SlideLoading from './components/SlideLoading.vue'
import { evalJs } from './runtime/moduleEval'
import { registerCustomComponent } from './runtime/moduleLoad'

export interface Islide extends SlideRoute {
  css: () => Promise<GenerateOutput>
}

export class SlideRenderer {
  private slidesInfo: SlideInfo[] = []
  private options: RendererOptions = {}
  private unoGenerator: UnoGenerator
  private SlideLoading = SlideLoading
  private SlideError = SlideError
  private customComponents: Record<string, Component>

  constructor(options: RendererOptions = {}) {
    this.options = {
      mdOptions: {},
      sfcOptions: {},
      ...options,
    }
    this.customComponents = options.components || {}
    // 将自定义组件注册到 moduleLoaders
    if (this.customComponents) {
      Object.entries(this.customComponents).forEach(([name, component]) => {
        registerCustomComponent(name, component)
      })
    }
    if (options.SlideLoading)
      this.SlideLoading = options.SlideLoading as any
    if (options.SlideError)
      this.SlideError = options.SlideError as any
    this.unoGenerator = new UnoGenerator(options.unoConfig)
  }

  private getSlidesInfo(slidesSource: SlideSource[]): SlideInfo[] {
    return slidesSource.map(
      (s, i) => ({
        frontmatter: s.frontmatter,
        content: s.content,
        note: s.note,
        index: i,
        source: {
          frontmatter: s.frontmatter,
          content: s.content,
          filepath: `/slides.md__slidev_${i}.md`,
          index: i,
          start: 0,
          contentStart: 0,
          end: 0,
          raw: '',
          revision: '',
        } satisfies SourceSlideInfo,
        revision: '',
      } satisfies SlideInfo),
    )
  }

  private getAsyncComponent(idx: number, loader: () => Promise<any>, slideLoading: Component, slideError: Component) {
    return defineAsyncComponent({
      loader,
      delay: 300,
      loadingComponent: slideLoading,
      errorComponent: slideError,
      onError: e => console.error(`Failed to load slide ${idx + 1}`, e),
    })
  }

  async render(slidesSource: SlideSource[]): Promise<Islide[]> {
    await this.unoGenerator.init()
    this.slidesInfo = this.getSlidesInfo(slidesSource)

    return this.slidesInfo.map((s, i) => {
      const no = i + 1
      let loaded: any

      const loader = async () => {
        if (loaded)
          return loaded

        const { js, errors } = await compileMd({
          slidesInfo: this.slidesInfo,
          filename: s.source.filepath,
          code: s.source.content,
          mdOptions: this.options.mdOptions,
          sfcOptions: this.options.sfcOptions,
          components: this.customComponents,
        })

        if (!js || errors?.length) {
          console.error(`Failed to compile slide ${no}`, errors)
          return SlideError
        }

        return loaded = await evalJs(js!, '')()
      }

      return {
        no,
        meta: {
          slide: {
            ...s,
            noteHTML: renderNote(s?.note),
            frontmatter: s.frontmatter,
            filepath: s.source.filepath,
            start: Number.NaN,
            id: i,
            no,
          },
          __clicksContext: null,
        },
        load: async () => ({ default: await loader() }),
        component: this.getAsyncComponent(i, loader, this.SlideLoading, this.SlideError),
        css: async () => await compileCss({
          code: s.source.content,
          unoGenerator: this.unoGenerator,
        }),
      } satisfies Islide
    })
  }

  parse(code: string) {
    return parseSync(code, '').slides.map((slide: any) => {
      return {
        frontmatter: slide.frontmatter,
        content: slide.content,
        note: slide.notes,
      }
    })
  }
}

// 保持向后兼容的函数式API
export async function renderMds(slidesSource: SlideSource[]): Promise<Islide[]> {
  const renderer = new SlideRenderer()
  const slides = await renderer.render(slidesSource)
  return slides
}
