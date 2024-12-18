// GENERATED FILE, DO NOT EDIT
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */

export const unocssBundle = new Map([
  ["@unocss/autocomplete", () => import('@unocss/autocomplete')] as any,
  ["@unocss/core", () => import('@unocss/core')] as any,
  ["@unocss/extractor-arbitrary-variants", () => import('@unocss/extractor-arbitrary-variants')] as any,
  ["@unocss/rule-utils", () => import('@unocss/rule-utils')] as any,
  ["@unocss/transformer-attributify-jsx", () => import('@unocss/transformer-attributify-jsx')] as any,
  ["@unocss/transformer-compile-class", () => import('@unocss/transformer-compile-class')] as any,
  ["@unocss/transformer-directives", () => import('@unocss/transformer-directives')] as any,
  ["@unocss/transformer-variant-group", () => import('@unocss/transformer-variant-group')] as any,
  ["unocss", () => import('unocss')] as any,
]) as Map<string, () => Promise<any>>

export const bundlePackages = [
  "@unocss/autocomplete",
  "@unocss/core",
  "@unocss/extractor-arbitrary-variants",
  "@unocss/rule-utils",
  "@unocss/transformer-attributify-jsx",
  "@unocss/transformer-compile-class",
  "@unocss/transformer-directives",
  "@unocss/transformer-variant-group",
  "unocss"
]

export const defaultConfigRaw = `import {
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
