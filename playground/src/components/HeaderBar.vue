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
// const showLoginModal = ref(false)
const showFileNameModal = ref(false) // 新增：控制文件名输入弹窗显示
const slidesFileName = ref('') // 新增：存储用户输入的文件名
const slidesAspectRatio = ref('16/9') // 新增：存储用户选择的尺寸比例
// const isLoading = ref(false)
const showCompletionModal = ref(false) // 新增：控制构建完成弹窗显示
const { buildingState, loadingSteps, handleStateChange, startSlidesBuilding, slidesUrl } = useMultiStepBuilding()

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

// async function loginWithGitHub() {
//   try {
//     isLoading.value = true

//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'github',
//       options: {
//         redirectTo: window.location.origin,
//       },
//     })

//     if (error) {
//       throw error
//     }
//     else {
//       // save searchParams to redirect back after login
//       localStorage.setItem(STORAGE_KEY, window.location.hash.slice(1))
//     }
//   }
//   catch (error) {
//     console.error('GitHub登录错误:', error)
//   }
//   finally {
//     isLoading.value = false
//   }
// }

async function handleStartBuilding() {
  // 检查用户是否已登录
  // const { data: { session } } = await supabase.auth.getSession()

  // if (session?.user) {
  // 用户已登录，显示文件名输入弹窗
  showFileNameModal.value = true
  // }
  // else {
  //   // 用户未登录，显示登录提示
  //   showLoginModal.value = true
  // }
}

// 新增：处理确认构建按钮点击
async function handleConfirmBuild() {
  // const { data: { session } } = await supabase.auth.getSession()
  // if (!session?.user) {
  //   showFileNameModal.value = false
  //   showLoginModal.value = true
  //   return
  // }
  if (slidesFileName.value.trim()) {
    // 关闭弹窗
    showFileNameModal.value = false
    // Define the Markdown front matter pattern
    const frontMatterPattern = '---\nlayout: intro\n---\n'

    // Process the Markdown content
    const mdc = inputMDC.value.startsWith(frontMatterPattern)
      ? encode(inputMDC.value.slice(frontMatterPattern.length))
      : encode(inputMDC.value)

    // Get username with fallback
    const userName = 'user'// session.user.user_metadata?.user_name || session.user.email || 'user'

    // Execute build with sanitized filename and aspect ratio
    await startSlidesBuilding(
      slidesFileName.value.trim(),
      mdc,
      userName,
      slidesAspectRatio.value, // 新增：传递尺寸参数
    )
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
    // showCompletionModal.value = false
  }
}

// 新增：复制构建链接
function copyBuildLink() {
  if (slidesUrl.value) {
    copy(slidesUrl.value)
    // 短暂延迟后关闭弹窗
    // setTimeout(() => {
    //   showCompletionModal.value = false
    // }, 1500)
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

    <!-- 登录提示弹窗 -->
    <!-- <div v-if="showLoginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </div> -->

    <!-- 新增：文件名输入弹窗 -->
    <div v-if="showFileNameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray/10 p-6 rounded-lg shadow-lg max-w-sm w-full backdrop-blur-2xl">
        <h3 class="text-lg font-bold mb-4">
          输入Slides设置
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

        <!-- 新增：尺寸选择 -->
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

        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray/10"
            @click="showFileNameModal = false"
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

    <!-- 新增：构建完成弹窗 -->
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
