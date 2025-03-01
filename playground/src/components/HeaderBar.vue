<script lang='ts' setup>
import { useClipboard } from '@vueuse/core'
import { compressToEncodedURIComponent as encode } from 'lz-string'
import { ref } from 'vue'
import { useMultiStepBuilding } from '../composables/build'
import { toggleDark } from '../composables/dark'
import { supabase } from '../composables/supabase'
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
const showLoginModal = ref(false)
const showFileNameModal = ref(false) // 新增：控制文件名输入弹窗显示
const slidesFileName = ref('') // 新增：存储用户输入的文件名
const isLoading = ref(false)
const { buildingState, loadingSteps, handleStateChange, handleComplete, startSlidesBuilding } = useMultiStepBuilding()

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

async function loginWithGitHub() {
  try {
    isLoading.value = true

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      throw error
    }
    else {
      // save searchParams to redirect back after login
      localStorage.setItem(STORAGE_KEY, window.location.hash.slice(1))
    }
  }
  catch (error) {
    console.error('GitHub登录错误:', error)
  }
  finally {
    isLoading.value = false
  }
}

async function handleStartBuilding() {
  // 检查用户是否已登录
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    // 用户已登录，显示文件名输入弹窗
    showFileNameModal.value = true
  }
  else {
    // 用户未登录，显示登录提示
    showLoginModal.value = true
  }
}

// 新增：处理确认构建按钮点击
function handleConfirmBuild() {
  if (slidesFileName.value.trim()) {
    // 关闭弹窗
    showFileNameModal.value = false
    // 执行构建，传入文件名
    startSlidesBuilding(slidesFileName.value)
  }
}

function handleDownload() {
  handleStartBuilding()
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
        @click="handleDownload"
      />
    </div>

    <!-- 登录提示弹窗 -->
    <div v-if="showLoginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray/10 p-6 rounded-lg shadow-lg max-w-sm w-full backdrop-blur-2xl">
        <h3 class="text-lg font-bold mb-4">
          需要登录
        </h3>
        <p class="mb-6">
          请使用GitHub账号登录后继续下载操作。
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray/10"
            @click="showLoginModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-500 text-white flex items-center gap-2 hover:bg-blue-600"
            :disabled="isLoading"
            @click="loginWithGitHub"
          >
            <div v-if="isLoading" class="i-svg-spinners-3-dots-fade w-4 h-4" />
            <div flex items-center gap-1>
              <div i-ri-github-line />登录
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 新增：文件名输入弹窗 -->
    <div v-if="showFileNameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray/10 p-6 rounded-lg shadow-lg max-w-sm w-full backdrop-blur-2xl">
        <h3 class="text-lg font-bold mb-4">
          输入Slides文件名
        </h3>
        <input
          v-model="slidesFileName"
          type="text"
          placeholder="请输入文件名"
          class="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600"
          @keyup.enter="handleConfirmBuild"
        >
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray/10"
            @click="showFileNameModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            :disabled="!slidesFileName.trim()"
            @click="handleConfirmBuild"
          >
            开始构建
          </button>
        </div>
      </div>
    </div>

    <MultiStepLoader
      :steps="loadingSteps"
      :loading="buildingState.showSteps"
      @state-change="handleStateChange"
      @complete="handleComplete"
      @close="buildingState.close"
    />
  </div>
</template>
