import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import type { HighlightAnnotation, UnocssPluginContext } from '@unocss/core'
import type { GenerateResult, UnoGenerator as UnoGeneratorType, UserConfig } from 'unocss'
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

// 清理 CSS 输出的辅助函数
function cleanOutput(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s+/g, '\n')
    .trim()
}

export class UnoGenerator {
  private unoGenerator: UnoGeneratorType | null = null
  private autocompleteInstance: ReturnType<typeof createAutocomplete> | null = null
  private customConfigRaw: string
  private customCSSLayerName: string

  constructor(options: {
    customConfigRaw?: string
    customCSSLayerName?: string
  } = {}) {
    this.customConfigRaw = options.customConfigRaw || defaultConfigRaw
    this.customCSSLayerName = options.customCSSLayerName || 'slidev'
  }

  public async init() {
    if (!this.unoGenerator) {
      const evaluatedConfig = await evaluateUserConfig(this.customConfigRaw, unocssBundle)
      this.unoGenerator = await createGenerator({}, evaluatedConfig)
    }
    if (!this.unoGenerator) {
      throw new Error('Failed to initialize unoGenerator')
    }
    !this.autocompleteInstance && (this.autocompleteInstance = createAutocomplete(this.unoGenerator))
    if (!this.autocompleteInstance) {
      throw new Error('Failed to initialize autocompleteInstance')
    }
    return this.unoGenerator
  }

  private async applyTransformers(
    code: MagicString,
    id: string,
    transformers: UnocssPluginContext['uno']['config']['transformers'],
    enforce?: 'pre' | 'post',
  ): Promise<HighlightAnnotation[]> {
    if (!transformers || !transformers.length)
      return []
    const applicableTransformers = transformers.filter(t => t.enforce === enforce)
    const annotations: HighlightAnnotation[] = []
    const fakePluginContext: UnocssPluginContext = { uno: this.unoGenerator } as any

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

  private async detectTransformer(
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
      cssAnnotations.push(...await this.applyTransformers(transformedCSS, 'input.css', transformers))
      // 在此示例中，我们没有处理 cssAnnotations，但可以根据需要进行处理
    }
    return { cssWarning, cssAnnotations }
  }

  private async getTransformed(type: 'html' | 'css', input: string): Promise<{
    output: string
    annotations: HighlightAnnotation[]
  }> {
    const id = type === 'html' ? 'input.html' : 'input.css'
    const magicString = new MagicString(input)
    const annotations: HighlightAnnotation[] = []
    const transformers = this.unoGenerator!.config.transformers || []

    annotations.push(...await this.applyTransformers(magicString, id, transformers, 'pre'))
    annotations.push(...await this.applyTransformers(magicString, id, transformers, undefined))
    annotations.push(...await this.applyTransformers(magicString, id, transformers, 'post'))

    return {
      output: type === 'html' ? magicString.toString() : cleanOutput(magicString.toString()),
      annotations,
    }
  }

  async generate(options: GenerateOptions): Promise<GenerateOutput> {
    const { inputHtml, customCSS = '' } = options
    let output: GenerateResult | null = null
    const annotations: HighlightAnnotation[] = []
    let customConfigError: Error | undefined
    let customCSSWarn: Error | undefined

    try {
      if (!this.unoGenerator) {
        throw new Error('Failed to initialize unoGenerator')
      }
      // 设置 preflights
      const evaluatedConfig = (await evaluateUserConfig(this.customConfigRaw, unocssBundle)) || {}
      const preflights = (evaluatedConfig.preflights ?? [])
        .filter((p: any) => p.layer !== this.customCSSLayerName)
      preflights.push({
        layer: this.customCSSLayerName,
        getCSS: () => cleanOutput(customCSS),
      })
      evaluatedConfig.preflights = preflights
      await this.unoGenerator.setConfig(evaluatedConfig as any)

      // 处理 CSS
      const magicCSS = new MagicString(customCSS)
      const { cssWarning } = await this.detectTransformer(
        this.unoGenerator.config.transformers,
        magicCSS,
      )
      customCSSWarn = cssWarning

      // 处理 HTML
      const transformedHTMLResult = await this.getTransformed('html', inputHtml)
      annotations.push(...transformedHTMLResult.annotations)

      // 生成最终的 CSS
      output = await this.unoGenerator.generate(transformedHTMLResult.output)

      // 处理 CSS 的转换结果
      const transformedResultCSS = await this.getTransformed('css', customCSS)
      annotations.push(...transformedResultCSS.annotations)
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

  async getHint(context: CompletionContext): Promise<CompletionResult | null> {
    if (!this.autocompleteInstance) {
      throw new Error('Failed to initialize autocompleteInstance')
    }
    const cursor = context.pos
    const result = await this.autocompleteInstance.suggestInFile(
      context.state.doc.toString(),
      cursor,
    )

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
}

// 向后兼容的函数式 API
export async function generateUnoCss(options: GenerateOptions): Promise<GenerateOutput> {
  const generator = new UnoGenerator({
    customConfigRaw: options.customConfigRaw,
    customCSSLayerName: options.customCSSLayerName,
  })
  await generator.init()
  return await generator.generate(options)
}

// 向后兼容的提示 API
export async function getHint(
  context: CompletionContext,
  config?: { customConfigRaw: string },
): Promise<CompletionResult | null> {
  const generator = new UnoGenerator({
    customConfigRaw: config?.customConfigRaw,
  })
  await generator.init()
  return await generator.getHint(context)
}
