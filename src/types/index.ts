import type { SlideInfo } from '@slidev/types'
import type { Component } from 'vue'
import type { UnoGenerator } from '../compiler/uno'

export type { SlideInfo, SlideRoute, SourceSlideInfo } from '@slidev/types'
export interface CompileResult {
  js?: string
  css?: string
  errors?: (string | Error)[]
}
export interface SlideSource {
  frontmatter: Record<string, string>
  content: string
  note: string
}

interface BaseConfigOptions {
  mdOptions?: Record<string, any>
  sfcOptions?: Record<string, any>
  components?: Record<string, Component>
  sfcComponents?: Record<string, string>
}

export interface CompileCssOptions {
  code: string
  unoGenerator: UnoGenerator
}

export interface CompileOptions extends BaseConfigOptions {
  slidesInfo: SlideInfo[]
  filename: string
  code: string
  unoGenerator?: UnoGenerator
}

export interface RendererOptions extends BaseConfigOptions {
  unoConfig?: {
    customConfigRaw?: string
    customCSSLayerName?: string
    uno?: boolean
  }
  SlideLoading?: Component
  SlideError?: Component
}
