import type { RendererOptions } from '@/index'
import { throttledWatch } from '@vueuse/core'
import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { ref, type Ref } from 'vue'

export const customCSSLayerName = 'playground'
export const defaultOptions = '{}'
export const STORAGE_KEY = 'authRedirect'
export const defaultMDC = `# Hello\n\nThis is a slide{.mt-5}\n\nCompiled in the **browser**`
function getAuthRedirectParams(key: string) {
  const data = localStorage.getItem(key)
  if (data) {
    localStorage.removeItem(key)
  }
  return data
}
const params = new URLSearchParams(
  getAuthRedirectParams(STORAGE_KEY)
  || window.location.hash.slice(1)
  || window.location.search
  || '',
)

export const inputMDC = ref(decode(params.get('mdc') || '') || defaultMDC)
export const options: Ref<RendererOptions> = ref(JSON.parse(decode(params.get('options') || '') || defaultOptions))
export const mode = ref(params.get('mode') || 'editor')
export const color = ref(params.get('color') || 'light')
export function updateUrl() {
  const url = new URL('/', window.location.origin)
  const newParams = new URLSearchParams()
  newParams.set('mdc', encode(inputMDC.value))
  newParams.set('options', encode(JSON.stringify(options.value)))
  newParams.set('mode', mode.value)
  newParams.set('color', color.value)
  window.history.replaceState('', '', `${url.pathname}#${newParams}`)
}

throttledWatch(
  [inputMDC, options, mode, color],
  () => updateUrl(),
  { throttle: 1000, deep: true },
)
