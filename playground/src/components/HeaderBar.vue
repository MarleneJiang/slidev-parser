<script lang='ts' setup>
import type { AspectRatio, BuildSlidesOptions, ColorSchema } from '../composables/build' // Corrected import order
import { useClipboard } from '@vueuse/core'
import { compressToEncodedURIComponent as encode } from 'lz-string'
import { ref } from 'vue'
import { useMultiStepBuilding } from '../composables/build'
import { toggleDark } from '../composables/dark'
import { inputMDC } from '../composables/url'
import MultiStepLoader from './MultiStepLoader.vue'

defineProps({
  paneSize: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleSize'])

const { copy, copied } = useClipboard()
const showSlidesSettingsModal = ref(false)
const slidesName = ref('')
const slidesAspectRatio = ref<AspectRatio>('16/9')
const slidesColorSchema = ref<ColorSchema>('light')
const exportType = ref<'web' | 'pptx'>('web') // Added ref for export type
const showCompletionModal = ref(false)

const { buildingState, loadingSteps, handleStateChange, startSlidesBuilding, slidesUrl, errorMessage, currentExportType } = useMultiStepBuilding()

function handleShare() {
  const url = new URL(window.location.href)
  copy(url.toString())
}

function handleReset() {
  // eslint-disable-next-line no-alert
  if (confirm('Reset all settings? It can NOT be undone.')) {
    inputMDC.value = ''
  }
}

function handleStartBuilding() {
  showSlidesSettingsModal.value = true
}

async function handleConfirmBuild() {
  if (!slidesName.value.trim()) {
    // eslint-disable-next-line no-alert
    alert('演示文稿名称不能为空！')
    return
  }

  showSlidesSettingsModal.value = false

  const frontMatterPattern = '---\nlayout: intro\n---\n' // Corrected multi-line string
  const mdcContent = inputMDC.value.startsWith(frontMatterPattern)
    ? inputMDC.value.slice(frontMatterPattern.length)
    : inputMDC.value

  const buildOptions: BuildSlidesOptions = {
    name: slidesName.value.trim(),
    mdc: encode(mdcContent),
    user: 'user',
    aspectRatio: slidesAspectRatio.value,
    colorSchema: slidesColorSchema.value,
    type: exportType.value, // Added export type to build options
  }

  try {
    await startSlidesBuilding(buildOptions)
  }
  catch (error) {
    console.error('Failed to build slides in component:', error)
    // eslint-disable-next-line no-alert
    alert(`构建失败: ${errorMessage.value || '请查看控制台获取更多信息。'}`)
  }
}

function handleComplete() {
  if (slidesUrl.value) {
    showCompletionModal.value = true
  }
}

function openInNewTab() {
  if (slidesUrl.value && currentExportType.value === 'web') { // Only open in new tab for web
    window.open(slidesUrl.value, '_blank')
  }
}

function copyBuildLink() {
  if (slidesUrl.value && currentExportType.value === 'web') { // Only copy link for web
    copy(slidesUrl.value)
    // Consider adding a visual feedback like changing button text to "Copied!" for a short duration
  }
}

function downloadPptx() {
  if (slidesUrl.value && currentExportType.value === 'pptx' && slidesName.value) {
    const link = document.createElement('a')
    link.href = slidesUrl.value
    link.setAttribute('download', `${slidesName.value.trim()}.pptx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
</script>

<template>
  <div
    class="p2 z-10 bg-gray/10"
    flex="~ items-center wrap gap-3" w-full
  >
    <div flex="~ items-center" cursor-pointer @click="emit('toggleSize')">
      <div flex items-center gap-2>
        <div :class="paneSize === 0 ? 'i-logos-slidev rotate-90' : 'i-logos-slidev'" />
        <div text-lg font-bold>
          SlidevParser
        </div>
      </div>
    </div>
    <div class="text-sm md:text-base flex flex-auto items-center justify-end flex-nowrap gap-1">
      <button
        :class="copied ? 'i-ri-checkbox-circle-line text-green' : 'i-ri-share-line'"
        icon-btn
        title="Share Link"
        @click="handleShare"
      />
      <button
        i-ri-eraser-line
        icon-btn
        title="Reset To Default"
        @click="handleReset"
      />
      <a
        i-ri-github-line icon-btn
        href="https://github.com/MarleneJiang/slidev-parser"
        target="_blank"
        title="GitHub"
      />
      <button
        i-ri-sun-line
        dark:i-ri-moon-line
        icon-btn
        title="Toggle Color Mode"
        @click="toggleDark"
      />
      <button
        i-ri-download-line
        icon-btn
        title="Download"
        @click="handleStartBuilding"
      />
    </div>

    <!-- 幻灯片设置弹窗 -->
    <div v-if="showSlidesSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full dark:text-gray-200">
        <h3 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
          幻灯片设置
        </h3>
        <div class="mb-4">
          <label for="slidesNameInput" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">文件名</label>
          <input
            id="slidesNameInput"
            v-model="slidesName"
            type="text"
            placeholder="请输入演示文稿名称"
            class="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">幻灯片尺寸</label>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="16/9"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span>16:9 (宽屏)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="4/3"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span>4:3 (传统)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="1/1"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span>1:1 (方形)</span>
            </label>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">主题颜色</label>
          <div class="flex gap-x-4 gap-y-2">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesColorSchema"
                type="radio"
                value="light"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span class="flex items-center">
                <div class="i-ri-sun-line mr-1" /> 浅色
              </span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesColorSchema"
                type="radio"
                value="dark"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span class="flex items-center">
                <div class="i-ri-moon-line mr-1" /> 深色
              </span>
            </label>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">导出类型</label>
          <div class="flex gap-x-4 gap-y-2">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="exportType"
                type="radio"
                value="web"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span>Web (在线)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="exportType"
                type="radio"
                value="pptx"
                class="form-radio text-blue-600 dark:text-blue-500 mr-1 focus:ring-blue-500"
              >
              <span>PPTX (PowerPoint)</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
            @click="showSlidesSettingsModal = false"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
            :disabled="!slidesName.trim()"
            @click="handleConfirmBuild"
          >
            开始构建
          </button>
        </div>
      </div>
    </div>

    <!-- 构建完成弹窗 -->
    <div v-if="showCompletionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-gray-200">
        <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          构建完成！
        </h3>
        <p v-if="currentExportType === 'web'" class="mb-3 text-gray-600 dark:text-gray-300">
          您的在线演示文稿已成功构建。
        </p>
        <p v-else-if="currentExportType === 'pptx'" class="mb-3 text-gray-600 dark:text-gray-300">
          您的 PowerPoint 文件已成功生成。
        </p>

        <div v-if="currentExportType === 'web'" class="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-6">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">访问链接:</label>
          <input
            type="text"
            :value="slidesUrl"
            readonly
            class="w-full p-2 border-none rounded bg-transparent text-sm text-gray-700 dark:text-gray-300 break-all select-all focus:ring-0 focus:outline-none"
            @click="($event.target as HTMLInputElement).select()"
          >
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            class="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
            @click="showCompletionModal = false"
          >
            关闭
          </button>
          <button
            v-if="currentExportType === 'web'"
            type="button"
            class="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-1.5 dark:focus:ring-offset-gray-800"
            @click="copyBuildLink"
          >
            <div :class="copied ? 'i-ri-check-line' : 'i-ri-clipboard-line'" class="w-4 h-4" />
            {{ copied ? '已复制!' : '复制链接' }}
          </button>
          <button
            v-if="currentExportType === 'web'"
            type="button"
            class="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-1.5 dark:focus:ring-offset-gray-800"
            @click="openInNewTab"
          >
            <div class="i-ri-external-link-line w-4 h-4" />
            在新标签页打开
          </button>
          <button
            v-if="currentExportType === 'pptx'"
            type="button"
            class="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center gap-1.5 dark:focus:ring-offset-gray-800"
            @click="downloadPptx"
          >
            <div class="i-ri-download-2-line w-4 h-4" />
            下载 PPTX 文件
          </button>
        </div>
      </div>
    </div>

    <MultiStepLoader
      :steps="loadingSteps"
      :loading="buildingState.showSteps"
      :prevent-close="true"
      :error-message="errorMessage"
      @state-change="handleStateChange"
      @complete="handleComplete"
      @close="buildingState.close"
    />
  </div>
</template>
