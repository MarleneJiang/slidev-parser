import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { dependencies } from './package.json'

export default defineConfig({
  plugins: [Vue()],
  optimizeDeps: {
    force: true, // 强制进行依赖预构建
    exclude: [
      '@iconify/utils/lib/loader/fs',
      '@iconify/utils/lib/loader/install-pkg',
      '@iconify/utils/lib/loader/node-loader',
      '@iconify/utils/lib/loader/node-loaders',
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'slidev-parser',
      // 构建好的文件名（不包括文件后缀）
      fileName: 'index',
    },
    rollupOptions: {
      external: ['unplugin-vue-markdown', ...Object.keys(dependencies)],
    },
  },
})
