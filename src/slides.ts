import type { SlideInfo, SlideRoute, SourceSlideInfo } from '@slidev/types'
import type { Component } from 'vue'
import type { GenerateOutput } from './compiler/uno'
import { defineAsyncComponent } from 'vue'
import { compileCss, compileMd } from './compiler/md'
import { renderNote } from './compiler/note'
import { UnoGenerator } from './compiler/uno'
import SlideError from './components/SlideError.vue'
import SlideLoading from './components/SlideLoading.vue'
import { evalJs } from './runtime/module'

export interface SlideSource {
  frontmatter: Record<string, string>
  content: string
  note: string
}

export interface RendererOptions {
  mdOptions?: Record<string, any>
  sfcOptions?: Record<string, any>
  unoConfig?: {
    customConfigRaw?: string
    customCSSLayerName?: string
  }
  SlideLoading?: Component
  SlideError?: Component
}

export interface Islide extends SlideRoute {
  css: () => Promise<GenerateOutput>
}

export class SlideRenderer {
  private slidesInfo: SlideInfo[] = []
  private options: RendererOptions = {}
  private unoGenerator: UnoGenerator
  private SlideLoading = SlideLoading
  private SlideError = SlideError

  constructor(options: RendererOptions = {}) {
    this.options = {
      mdOptions: {},
      sfcOptions: {},
      ...options,
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
          slidesInfo: this.slidesInfo,
          filename: s.source.filepath,
          code: s.source.content,
          unoGenerator: this.unoGenerator,
        }),
      } satisfies Islide
    })
  }
}

// 保持向后兼容的函数式API
export async function renderMds(slidesSource: SlideSource[]): Promise<Islide[]> {
  const renderer = new SlideRenderer()
  const slides = await renderer.render(slidesSource)
  return slides
}
