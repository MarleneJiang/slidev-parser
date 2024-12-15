import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import type { HighlightAnnotation, UnocssPluginContext } from '@unocss/core'
import type { GenerateResult, UnoGenerator, UserConfig } from 'unocss'
import { createAutocomplete } from '@unocss/autocomplete'
import MagicString from 'magic-string'
import { createGenerator } from 'unocss'
import { unocssBundle } from '../configs/unocssBundle'
import { evaluateUserConfig } from '../runtime/config'

// 定义输入和输出接口
export interface GenerateOptions {
  inputHtml: string
  customConfigRaw?: string
  customCSS?: string
  defaultConfig?: UserConfig
  customCSSLayerName?: string
}

export interface GenerateOutput {
  output: GenerateResult | null
  annotations?: HighlightAnnotation[]
  customConfigError?: Error
  customCSSWarn?: Error
}

const defaultConfigRaw = `import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from 'unocss'

export default defineConfig({
  rules: [
    ['custom-rule', { color: 'red' }],
  ],
  shortcuts: {
    'custom-shortcut': 'text-lg text-orange hover:text-teal',
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
})
`

// 检测 transformers 的函数
async function detectTransformer(
  unoGenerator: UnoGenerator,
  transformers: UnocssPluginContext['uno']['config']['transformers'],
  transformedCSS: MagicString,
): Promise<{ cssWarning?: Error, cssAnnotations?: any[] }> {
  let cssWarning: Error | undefined
  const cssAnnotations: any[] = []
  if (!transformers || !transformers.some(t => t.name === '@unocss/transformer-directives')) {
    const msg = '使用 directives 需要安装 \'@unocss/transformer-directives\'。'
    cssWarning = new Error(msg)
    // 如果缺少特定的 transformer，可以决定是否对 CSS 进行特殊处理
    // 例如，直接使用原始的 customCSS
    // 这里假设我们保持 transformedCSS 不变
  }
  else {
    // 如果存在 transformer-directives，则应用相应的转换
    cssAnnotations.push(...await applyTransformers(unoGenerator, transformedCSS, 'input.css', transformers))
    // 在此示例中，我们没有处理 cssAnnotations，但可以根据需要进行处理
  }
  return { cssWarning, cssAnnotations }
}

// 清理 CSS 输出的辅助函数
function cleanOutput(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s+/g, '\n')
    .trim()
}

// 应用 transformers 的辅助函数
async function applyTransformers(
  unoGenerator: UnoGenerator,
  code: MagicString,
  id: string,
  transformers: UnocssPluginContext['uno']['config']['transformers'],
  enforce?: 'pre' | 'post',
): Promise<HighlightAnnotation[]> {
  if (!transformers || !transformers.length)
    return []
  const applicableTransformers = transformers.filter(t => t.enforce === enforce)
  const annotations: HighlightAnnotation[] = []
  const fakePluginContext: UnocssPluginContext = { uno: unoGenerator } as any

  for (const transformer of applicableTransformers) {
    if (transformer.idFilter && !transformer.idFilter(id))
      continue
    const result = await transformer.transform(code, id, fakePluginContext)
    if (result?.highlightAnnotations) {
      annotations.push(...result.highlightAnnotations)
    }
  }

  return annotations
}

// 生成 CSS 的函数
async function generateCSS(
  unoGenerator: UnoGenerator,
  transformedHTML: string,
): Promise<GenerateResult> {
  return await unoGenerator.generate(transformedHTML)
}

// 获取自动完成提示的函数

export async function getHint(
  context: CompletionContext,
  config?: { customConfigRaw: string },
): Promise<CompletionResult | null> {
  const { customConfigRaw = defaultConfigRaw } = config || {}
  const evaluatedConfig = await evaluateUserConfig(customConfigRaw, unocssBundle)
  const unoGenerator = await createGenerator({}, evaluatedConfig)
  const autocompleteInstance = createAutocomplete(unoGenerator)
  const cursor = context.pos
  const result = await autocompleteInstance.suggestInFile(context.state.doc.toString(), cursor)

  if (!result?.suggestions?.length)
    return null

  const resolved = result.resolveReplacement(result.suggestions[0][0])
  return {
    from: resolved.start,
    options: result.suggestions.map(([value, label]) => ({
      label,
      apply: value,
      type: 'text',
      boost: 99,
    })),
  }
}

// 主要的纯函数，将所有逻辑串联起来
export async function generateUnoCss(options: GenerateOptions): Promise<GenerateOutput> {
  const { inputHtml, customConfigRaw = defaultConfigRaw, customCSS = '', customCSSLayerName = 'slidev' } = options

  // 初始化输出变量
  let output: GenerateResult | null = null
  const annotations: HighlightAnnotation[] = []
  let customConfigError: Error | undefined
  let customCSSWarn: Error | undefined

  // 定义转换器辅助函数
  async function getTransformed(unoGenerator: UnoGenerator, type: 'html' | 'css'): Promise<{ output: string, annotations: HighlightAnnotation[] }> {
    const isHTML = type === 'html'
    const id = isHTML ? 'input.html' : 'input.css'
    const input = new MagicString(isHTML ? inputHtml : customCSS)
    const annotations: HighlightAnnotation[] = []
    const transformers = unoGenerator.config.transformers || []

    // 应用 pre, default, post transformers
    annotations.push(...await applyTransformers(unoGenerator, input, id, transformers, 'pre'))
    annotations.push(...await applyTransformers(unoGenerator, input, id, transformers, undefined))
    annotations.push(...await applyTransformers(unoGenerator, input, id, transformers, 'post'))

    return {
      output: isHTML ? input.toString() : cleanOutput(input.toString()),
      annotations,
    }
  }

  // 处理配置和 CSS 的变化
  try {
    // 评估用户配置
    const evaluatedConfig = await evaluateUserConfig(customConfigRaw, unocssBundle)
    // 初始化 UnoCSS 生成器
    const unoGenerator = await createGenerator({}, evaluatedConfig)
    if (evaluatedConfig) {
      // 处理 preflights
      const preflights = (evaluatedConfig.preflights ?? []).filter((p: any) => p.layer !== customCSSLayerName)
      preflights.push({
        layer: customCSSLayerName,
        getCSS: () => cleanOutput(customCSS),
      })
      evaluatedConfig.preflights = preflights

      // 设置新的配置
      await unoGenerator.setConfig(evaluatedConfig)

      // 检测并应用 transformers
      const { transformers = [] } = unoGenerator.config

      // 处理 CSS
      const magicCSS = new MagicString(customCSS)
      const { cssWarning } = await detectTransformer(unoGenerator, transformers, magicCSS)
      customCSSWarn = cssWarning
      // eslint-disable-next-line unused-imports/no-unused-vars
      const transformedCSS = cleanOutput(magicCSS.toString())

      // 处理 HTML
      const transformedHTMLResult = await getTransformed(unoGenerator, 'html')
      const transformedHTML = transformedHTMLResult.output
      annotations.push(...transformedHTMLResult.annotations)

      // 生成 CSS
      output = await generateCSS(unoGenerator, transformedHTML)

      // 处理注解
      const transformedResultCSS = await getTransformed(unoGenerator, 'css')
      annotations.push(...transformedResultCSS.annotations)
    }
  }
  catch (e) {
    console.error(e)
    customConfigError = e as Error
  }

  return {
    output,
    annotations,
    customConfigError,
    customCSSWarn,
  }
}
