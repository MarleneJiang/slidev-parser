<script setup lang="ts">
import type { Component, PropType } from 'vue'
import type { RendererOptions } from '../index'
import { useElementSize } from '@vueuse/core'
import { $fetch } from 'ofetch'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { compileCss, compileVue, evalJs, UnoGenerator } from '../index'
import remoteError from './SlideError.vue'
import remoteLoading from './SlideLoading.vue'
import { removeCss, updateDynamicCss } from './utils'

const props = defineProps({
  name: {
    type: String,
    default: `${Date.now()}.vue`,
  },
  url: {
    type: String,
    required: true,
  },
  attrs: {
    type: Object,
    default: () => ({}),
  },
  remoteAspect: {
    type: Number,
    default: 16 / 9,
  },
  remoteWidth: {
    type: Number,
    default: undefined,
  },
  remoteHeight: {
    type: Number,
    default: undefined,
  },
  zoom: {
    type: Number,
    default: 1,
  },
  rendererOptions: {
    type: Object as PropType<RendererOptions>,
    default: () => ({}),
  },
  flexable: {
    type: Boolean,
    default: false,
  },
})

const root = ref<HTMLDivElement>()
const generator = ref<UnoGenerator>()
const element = useElementSize(root)

const width = computed(() => element.width.value)
const height = computed(() => width.value / props.remoteAspect)

const shouldScale = computed(() =>
  props.remoteWidth !== undefined
  && props.remoteHeight !== undefined,
)

const scale = computed(() => {
  if (props.remoteWidth === undefined
    || props.remoteHeight === undefined) {
    return props.zoom
  }
  return Math.min(
    width.value / props.remoteWidth,
    height.value / props.remoteHeight,
  ) * props.zoom
})

const style = computed(() => ({
  height: props.flexable ? `${height.value}px` : '100%',
  width: props.flexable ? `${width.value}px` : '100%',
}))

const contentStyle = computed(() => ({
  height: shouldScale.value ? `${props.remoteHeight}px` : '100%',
  width: shouldScale.value ? `${props.remoteWidth}px` : '100%',
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))

const renderedComp = shallowRef()

enum remoteStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

const status = ref<remoteStatus>(remoteStatus.Loading)

async function updateRemote() {
  try {
    // 校验是否为符合格式的url
    if (!props.url || !props.url.startsWith('http')) {
      throw new Error('Invalid remote url')
    }
    status.value = remoteStatus.Loading
    const remoteContent = await $fetch(props.url, { parseResponse: txt => txt })
    if (!remoteContent) {
      throw new Error('Remote content is empty')
    }
    const vueObj = await compileVue(props.name, remoteContent, props?.rendererOptions?.sfcOptions || {})
    if (generator.value && vueObj.css)
      updateDynamicCss(`${vueObj.css}\n${(await compileCss({ code: remoteContent, unoGenerator: generator.value }))?.output?.css}`, `${props.name}-css`)
    else if (vueObj.css)
      updateDynamicCss(vueObj.css, `${props.name}-css`)
    else if (generator.value)
      updateDynamicCss(`${(await compileCss({ code: remoteContent, unoGenerator: generator.value }))?.output?.css}`, `${props.name}-css`)
    renderedComp.value = getAsyncComponent(async () => (await evalJs(vueObj.js!, '')()), remoteLoading, remoteError)
    status.value = remoteStatus.Loaded
  }
  catch (error) {
    console.error('更新remoteComp时出错:', error)
    status.value = remoteStatus.Error
  }
}
function getAsyncComponent(loader: () => Promise<any>, slideLoading: Component, slideError: Component) {
  return defineAsyncComponent({
    loader,
    delay: 300,
    loadingComponent: slideLoading,
    errorComponent: slideError,
    onError: e => console.error(`Failed to load remoteComp`, e),
  })
}
onMounted(async () => {
  if (props?.rendererOptions?.unoConfig?.uno) {
    generator.value = new UnoGenerator({
      customConfigRaw: props?.rendererOptions?.unoConfig?.customConfigRaw,
      customCSSLayerName: props?.rendererOptions?.unoConfig?.customCSSLayerName,
    })
    await generator.value.init()
  }
  updateRemote()
})
watch(() => props.url, updateRemote, { deep: true })
onUnmounted(() => {
  removeCss(props.name)
})
</script>

<template>
  <div ref="root" class="remote-container">
    <div class="remote-content" :style="style">
      <div :class="{ 'remote-inner': flexable }" :style="shouldScale ? contentStyle : ''">
        <template v-if="status === remoteStatus.Loading">
          <slot name="loading">
            <remoteLoading />
          </slot>
        </template>
        <template v-else-if="status === remoteStatus.Error">
          <slot name="error">
            <remoteError />
          </slot>
        </template>
        <template v-else>
          <slot name="remote" :component="renderedComp">
            <component :is="renderedComp" v-bind="attrs">
              <template v-for="(slotContent, slotName) in $slots" #[slotName]="slotProps">
                <slot :name="slotName" v-bind="slotProps">
                  {{ slotContent(slotProps) }}
                </slot>
              </template>
            </component>
          </slot>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.remote-container {
  position: relative;
  /* width: 100%; */
  /* height: 100%; */
}

.remote-content {
  position: relative;
  overflow: hidden;
}

.remotes-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  /* 居中对齐 */
}

.remote-inner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center;
}
</style>
