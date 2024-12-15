import { createApp } from 'vue'
import TestRenderMds from './TestRenderMds.vue'

const window = globalThis.window as any
window.process = { env: {} }
createApp(TestRenderMds).mount('#app')
