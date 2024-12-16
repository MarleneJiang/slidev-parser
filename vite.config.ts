import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { dependencies } from './package.json'

export default defineConfig({
  plugins: [Vue(), UnoCSS({
    mode: 'vue-scoped',
  })],
  build: {
    sourcemap: false,
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'slidev-parser',
      fileName: format => `index.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: [...Object.keys(dependencies)],
      output: {
        globals: {
          'magic-string': 'MagicString',
          'unocss': 'UnoCSS',
          'ofetch': 'ofetch',
          'markdown-it': 'MarkdownIt',
          'markdown-it-footnote': 'markdownItFootnote',
          'markdown-it-mdc': 'markdownItMdc',
          '@antfu/utils': 'antfuUtils',
          'kolorist': 'kolorist',
          'ohash': 'ohash',
          'sucrase': 'sucrase',
          'pathe': 'pathe',
          '@babel/standalone': 'Babel',
          '@vue/babel-plugin-jsx': 'vueJsx',
          'vue': 'Vue',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css')
            return 'index.css'
          return assetInfo.name || 'default.css'
        },
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
  },
})
