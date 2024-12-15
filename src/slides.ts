import type { SlideInfo, SlideRoute, SourceSlideInfo } from '@slidev/types'
import type { GenerateOutput } from './compiler/uno'
import { defineAsyncComponent } from 'vue'
import { compileCss, compileMd } from './compiler/md'
import { renderNote } from './compiler/note'
import SlideError from './components/SlideError.vue'
import SlideLoading from './components/SlideLoading.vue'
import { evalJs } from './runtime/module'

export interface SlideSource {
  frontmatter: Record<string, string>
  content: string
  note: string
}

function getSlidesInfo(slidesSource: SlideSource[]): SlideInfo[] {
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

function getAsyncComponent(idx: number, loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    delay: 300,
    loadingComponent: SlideLoading,
    errorComponent: SlideError,
    onError: e => console.error(`Failed to load slide ${idx + 1}`, e),
  })
}

interface Islide extends SlideRoute {
  css: () => Promise<GenerateOutput>
}

export function renderMds(slidesSource: SlideSource[]): Islide[] {
  const slidesInfo = getSlidesInfo(slidesSource)
  return slidesInfo.map((s, i) => {
    const no = i + 1
    let loaded: any
    const loader = async () => {
      if (loaded)
        return loaded
      const { js, errors } = await compileMd({ slidesInfo, filename: s.source.filepath, code: s.source.content })
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
      component: getAsyncComponent(i, loader),
      css: async () => { return (await compileCss({ slidesInfo, filename: s.source.filepath, code: s.source.content })) },
    } satisfies Islide
  })
}
