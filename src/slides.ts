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
import { registerCustomComponent, registerStringComponent } from './runtime/moduleLoad'

export interface Islide extends SlideRoute {
  css: () => Promise<GenerateOutput>
}

export class SlideRenderer {
  // private slidesInfo: SlideInfo[] = []
  private options: RendererOptions = {}
  private unoGenerator: UnoGenerator
  private SlideLoading = SlideLoading
  private SlideError = SlideError
  private customComponents: Record<string, Component>
  private sfcComponents: Record<string, string>

  constructor(options: RendererOptions = {}) {
    this.options = {
      mdOptions: {},
      sfcOptions: {},
      ...options,
    }
    this.customComponents = options.components || {}
    this.sfcComponents = options.sfcComponents || {}
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

  async initSfcComponents(sfcComponents: Record<string, string> = this.sfcComponents) {
    await this.unoGenerator.init()
    if (sfcComponents) {
      await Promise.all(
        Object.entries(sfcComponents).map(([name, content]) => registerStringComponent(name, content, this.unoGenerator)),
      )
    }
    else {
      console.error('sfcComponents is not defined')
    }
  }

  getSlidesInfo(slidesSource: SlideSource[]): SlideInfo[] {
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
    const currentSlidesInfo = this.getSlidesInfo(slidesSource)

    return currentSlidesInfo.map((s, i) => {
      const no = i + 1
      let loaded: any

      const loader = async () => {
        if (loaded)
          return loaded
        const { js, errors } = await compileMd({
          slidesInfo: currentSlidesInfo,
          filename: s.source.filepath,
          code: s.source.content,
          frontmatter: s.source.frontmatter,
          mdOptions: this.options.mdOptions,
          sfcOptions: this.options.sfcOptions,
          components: this.customComponents,
          sfcComponents: this.sfcComponents,
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
          frontmatter: s.frontmatter,
          unoGenerator: this.unoGenerator,
        }),
      } satisfies Islide
    })
  }

  static parse(code: string) {
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
export async function renderMds(slidesSource: SlideSource[], rendererOptions: RendererOptions = {}): Promise<Islide[]> {
  const renderer = new SlideRenderer(rendererOptions)
  await renderer.initSfcComponents()
  const slides = await renderer.render(slidesSource)
  return slides
}
