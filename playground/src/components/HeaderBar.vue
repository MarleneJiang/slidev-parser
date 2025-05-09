<script lang='ts' setup>
import { useClipboard } from '@vueuse/core'
import { compressToEncodedURIComponent as encode } from 'lz-string'
import { ref } from 'vue'
import { useMultiStepBuilding } from '../composables/build'
import { toggleDark } from '../composables/dark'
// import { supabase } from '../composables/supabase'
import { inputMDC, STORAGE_KEY } from '../composables/url'
import MultiStepLoader from './MultiStepLoader.vue'
// 接收 paneSize 的 props，并定义切换事件
defineProps({
  paneSize: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleSize'])

const { copy, copied } = useClipboard()
const showSlidesSettingsModal = ref(false) // 控制幻灯片设置弹窗显示
const slidesFileName = ref('') // 存储用户输入的文件名
const slidesAspectRatio = ref('16/9') // 存储用户选择的尺寸比例
const slidesColorSchema = ref('light') // 新增：存储用户选择的颜色主题
const showCompletionModal = ref(false) // 控制构建完成弹窗显示
const { buildingState, loadingSteps, handleStateChange, startSlidesBuilding, slidesUrl, errorMessage } = useMultiStepBuilding()

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

// 打开幻灯片设置弹窗
function handleStartBuilding() {
  showSlidesSettingsModal.value = true
}

// 处理确认构建
async function handleConfirmBuild() {
  if (!slidesFileName.value.trim())
    return

  // 关闭弹窗
  showSlidesSettingsModal.value = false

  // 处理Markdown内容
  const frontMatterPattern = '---\nlayout: intro\n---\n'
  const mdc = inputMDC.value.startsWith(frontMatterPattern)
    ? encode(inputMDC.value.slice(frontMatterPattern.length))
    : encode(inputMDC.value)

  try {
    // 执行构建
    await startSlidesBuilding(
      slidesFileName.value.trim(),
      mdc,
      'user', // 简化用户标识
      slidesAspectRatio.value,
      slidesColorSchema.value,
    )
  }
  catch (error) {
    console.error('Failed to build slides:', error)
    // Optionally, show an error message to the user
    // For example, by setting another ref and displaying it in the UI
    // eslint-disable-next-line no-alert
    alert(`构建失败，请查看控制台获取更多信息。\n${errorMessage.value}`)
  }
}

function handleComplete() {
  // 显示构建完成弹窗
  if (slidesUrl.value) {
    showCompletionModal.value = true
  }
}

// 新增：在新标签页打开链接
function openInNewTab() {
  if (slidesUrl.value) {
    window.open(slidesUrl.value, '_blank')
  }
}

// 新增：复制构建链接
function copyBuildLink() {
  if (slidesUrl.value) {
    copy(slidesUrl.value)
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
    <div v-if="showSlidesSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray/10 p-6 rounded-lg shadow-lg max-w-sm w-full backdrop-blur-2xl">
        <h3 class="text-lg font-bold mb-4">
          幻灯片设置
        </h3>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">文件名</label>
          <input
            v-model="slidesFileName"
            type="text"
            placeholder="请输入文件名"
            class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
        </div>

        <!-- 尺寸选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">幻灯片尺寸</label>
          <div class="flex flex-wrap gap-3">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="16/9"
                class="mr-1"
              >
              <span>16:9 (宽屏)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="4/3"
                class="mr-1"
              >
              <span>4:3 (传统)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesAspectRatio"
                type="radio"
                value="1/1"
                class="mr-1"
              >
              <span>1:1 (方形)</span>
            </label>
          </div>
        </div>

        <!-- 颜色主题选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">主题颜色</label>
          <div class="flex gap-4">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="slidesColorSchema"
                type="radio"
                value="light"
                class="mr-1"
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
                class="mr-1"
              >
              <span class="flex items-center">
                <div class="i-ri-moon-line mr-1" /> 深色
              </span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray/10"
            @click="showSlidesSettingsModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="!slidesFileName.trim()"
            @click="handleConfirmBuild"
          >
            开始构建
          </button>
        </div>
      </div>
    </div>

    <!-- 构建完成弹窗 -->
    <div v-if="showCompletionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray/10 p-6 rounded-lg shadow-lg max-w-md w-full backdrop-blur-2xl">
        <h3 class="text-lg font-bold mb-4">
          构建完成
        </h3>
        <p class="mb-2">
          您的Slides已成功构建。您可以通过以下链接访问：
        </p>
        <div class="bg-gray-100 dark:bg-gray-700 p-2 rounded mb-4 text-sm break-all">
          {{ slidesUrl }}
        </div>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
            @click="showCompletionModal = false"
          >
            关闭
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
            @click="copyBuildLink"
          >
            <div :class="copied ? 'i-ri-checkbox-circle-line' : 'i-ri-clipboard-line'" />
            {{ copied ? '已复制' : '复制链接' }}
          </button>
          <button
            class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 flex items-center gap-1"
            @click="openInNewTab"
          >
            <div class="i-ri-external-link-line" />
            打开链接
          </button>
        </div>
      </div>
    </div>

    <MultiStepLoader
      :steps="loadingSteps"
      :loading="buildingState.showSteps"
      :prevent-close="true"
      @state-change="handleStateChange"
      @complete="handleComplete"
      @close="buildingState.close"
    />
  </div>
</template>
