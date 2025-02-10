<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { Pane, Splitpanes } from 'splitpanes'
import { ref } from 'vue'
import Editor from './Edit.vue'
import Preview from './Preview.vue'

const bp = useBreakpoints(breakpointsTailwind)

const isMobile = bp.smaller('sm')
const isResizing = ref(false)
</script>

<template>
  <Splitpanes
    h-screen
    w-screen
    :horizontal="isMobile"
    @resized="isResizing = false"
    @resize="isResizing = true"
  >
    <Pane>
      <Editor border="r t main solid" />
    </Pane>
    <Pane>
      <Preview :resizing="isResizing" />
    </Pane>
  </Splitpanes>
</template>
