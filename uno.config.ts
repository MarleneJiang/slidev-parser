import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'c-primary': 'c-[#1c6b48] dark:c-[#5cad8a]',
    'border-main': 'border-gray/20',
    'bg-main': 'bg-white dark:bg-hex-121212',
    'bg-hover': 'bg-gray/10',
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
    presetWebFonts({
      fonts: {
        mono: 'Fira Code',
        sans: ['Avenir Next', 'Nunito Sans'],
        local: 'Avenir Next',
      },
      processors: createLocalFontProcessor(),
    }),
  ],
  transformers: [
    transformerCompileClass(),
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
