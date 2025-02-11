import { resolve } from 'node:path'
import process from 'node:process'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { dependencies } from './package.json'

// eslint-disable-next-line unused-imports/no-unused-vars
export default defineConfig(({ command, mode }) => {
  const baseConfig = { resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  }, plugins: [
    Vue({
      include: [/\.vue$/, 'playground/src/**/*.vue'],
    }),
    UnoCSS({ mode: 'vue-scoped' }),
  ], optimizeDeps: {
    exclude: [
      '@iconify/utils/lib/loader/fs',
      '@iconify/utils/lib/loader/install-pkg',
      '@iconify/utils/lib/loader/node-loader',
      '@iconify/utils/lib/loader/node-loaders',
    ],
  } }
  if (process.env.BUILD_TARGET === 'playground') {
    // playground 前端产物构建配置
    return {
      ...baseConfig,
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          external: [
            // ...Object.keys(dependencies),
            // 'vue',
            '@iconify/utils/lib/loader/fs',
            '@iconify/utils/lib/loader/install-pkg',
            '@iconify/utils/lib/loader/node-loader',
            '@iconify/utils/lib/loader/node-loaders',
          ],
        },
        cssCodeSplit: true,
        cssMinify: true,
        // ...其他 playground 专用设置...
      },
    }
  }

  // 主库构建配置
  return {
    ...baseConfig,
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
        external: [
          ...Object.keys(dependencies),
          'vue',
          '@iconify/utils/lib/loader/fs',
          '@iconify/utils/lib/loader/install-pkg',
          '@iconify/utils/lib/loader/node-loader',
          '@iconify/utils/lib/loader/node-loaders',
        ],
        output: {
          globals: {
            'magic-string': 'MagicString',
            'unocss': 'UnoCSS',
            '@unocss/autocomplete': 'unocssAutocomplete',
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
            '@vueuse/core': 'VueUse',
            '@slidev/parser': 'SlidevParser',
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
  }
})
