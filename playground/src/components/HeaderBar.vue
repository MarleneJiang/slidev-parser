<script lang='ts' setup>
import { useClipboard } from '@vueuse/core'
import { toggleDark } from '../composables/dark'
import { inputMDC } from '../composables/url'

// 接收 paneSize 的 props，并定义切换事件
defineProps({
  paneSize: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleSize'])

const { copy, copied } = useClipboard()

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

function handleDownload() {

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
  </div>
</template>
