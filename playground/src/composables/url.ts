import type { RendererOptions } from '@/index'
import { throttledWatch } from '@vueuse/core'
import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { ref, type Ref } from 'vue'

export const customCSSLayerName = 'playground'
export const defaultOptions = '{}'
export const STORAGE_KEY = 'last-search'
export const defaultMDC = `# Hello\n\nThis is a slide{.mt-5}\n\nCompiled in the **browser**`

const params = new URLSearchParams(
  window.location.hash.slice(1)
  || window.location.search
  || localStorage.getItem(STORAGE_KEY)
  || '',
)

export const inputMDC = ref(decode(params.get('mdc') || '') || defaultMDC)
export const options: Ref<RendererOptions> = ref(JSON.parse(decode(params.get('options') || '') || defaultOptions))

export function updateUrl() {
  const url = new URL('/play/', window.location.origin)
  params.set('mdc', encode(inputMDC.value))
  // params.set('options', encode(JSON.stringify(options.value)))
  localStorage.setItem(STORAGE_KEY, url.search)
  window.history.replaceState('', '', `${url.pathname}#${params}`)
}

throttledWatch(
  [inputMDC, options],
  () => updateUrl(),
  { throttle: 1000, deep: true },
)
