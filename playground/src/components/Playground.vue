<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, ref } from 'vue'
import { isDark } from '../composables/dark'
import { color, mode } from '../composables/url'
import Editor from './Edit.vue'
import HeaderBar from './HeaderBar.vue'
import Preview from './Preview.vue'

const bp = useBreakpoints(breakpointsTailwind)
const isMobile = bp.smaller('sm')
const isResizing = ref(false)

const paneSize = ref(mode.value === 'preview' ? 0 : 50)
const savedSize = ref(50)

function toggleSize() {
  if (mode.value === 'preview')
    return
  if (paneSize.value > 0) {
    savedSize.value = paneSize.value
    paneSize.value = 0
  }
  else {
    paneSize.value = savedSize.value || 50
  }
}
function onResize($event) {
  isResizing.value = true
  paneSize.value = $event[0].size
}

onMounted(() => {
  if (color.value === 'dark') {
    isDark.value = true
  }
  else {
    isDark.value = false
  }
})
</script>

<template>
  <Splitpanes
    h-screen
    w-screen
    :horizontal="isMobile"
    @resize="onResize"
    @resized="isResizing = false"
  >
    <Pane v-if="mode !== 'preview'" :size="paneSize">
      <Editor border="r t main solid" />
    </Pane>
    <Pane flex="~ col" h-full :size="100 - paneSize">
      <HeaderBar :pane-size="paneSize" @toggle-size="toggleSize" />
      <div flex-1 of-hidden>
        <Preview />
      </div>
    </Pane>
  </Splitpanes>
</template>
