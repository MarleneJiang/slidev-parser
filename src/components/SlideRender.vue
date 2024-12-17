<script setup lang="ts">
import type { PropType } from 'vue'
import type { RendererOptions, SlideSource } from '../index'
import { useElementSize } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { SlideRenderer } from '../index'
import SlideError from './SlideError.vue'
import SlideLoading from './SlideLoading.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  slide: {
    type: Object as PropType<SlideSource>,
    required: true,
  },
  slideAspect: {
    type: Number,
    default: 16 / 9,
  },
  slideWidth: {
    type: Number,
    default: undefined,
  },
  slideHeight: {
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
const slideRenderer = ref<SlideRenderer>()
const element = useElementSize(root)

const width = computed(() => element.width.value)
const height = computed(() => width.value / props.slideAspect)

const shouldScale = computed(() =>
  props.slideWidth !== undefined
  && props.slideHeight !== undefined,
)

const scale = computed(() => {
  if (props.slideWidth === undefined
    || props.slideHeight === undefined) {
    return props.zoom
  }
  return Math.min(
    width.value / props.slideWidth,
    height.value / props.slideHeight,
  ) * props.zoom
})

const style = computed(() => ({
  height: props.flexable ? `${height.value}px` : '100%',
  width: props.flexable ? `${width.value}px` : '100%',
}))

const contentStyle = computed(() => ({
  height: shouldScale.value ? `${props.slideHeight}px` : '100%',
  width: shouldScale.value ? `${props.slideWidth}px` : '100%',
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))

const renderedComp = shallowRef()

enum SlideStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

const status = ref<SlideStatus>(SlideStatus.Loading)

function updateDynamicCss(css: string) {
  try {
    // 创建一个 <style> 标签来插入 CSS
    let style = document.getElementById(props.id || 'dynamic-style') as HTMLStyleElement
    if (!style) {
      style = document.createElement('style')
      style.id = props.id || 'dynamic-style'
      style.type = 'text/css'
      document.head.appendChild(style)
    }
    // 设置新的 CSS 内容
    style.innerHTML = css
  }
  catch (error) {
    console.error('更新动态CSS时出错:', error)
  }
}

async function updateSlide(slide: SlideSource) {
  try {
    status.value = SlideStatus.Loading
    const renderedSlide = (await slideRenderer.value!.render([slide]))[0]
    if (!renderedSlide) {
      console.warn('没有可渲染的幻灯片')
      status.value = SlideStatus.Error
      return
    }
    renderedComp.value = renderedSlide
    const css = await renderedSlide.css()
    if (css?.output?.css) {
      updateDynamicCss(css.output.css)
    }
    status.value = SlideStatus.Loaded
  }
  catch (error) {
    console.error('更新幻灯片时出错:', error)
    status.value = SlideStatus.Error
  }
}
onMounted(() => {
  slideRenderer.value = new SlideRenderer(props.rendererOptions)
  updateSlide(props.slide)
})
watch(() => props.slide, updateSlide, { deep: true })
onUnmounted(() => {
  const style = document.getElementById(props.id || 'dynamic-style')
  if (style) {
    style.remove()
  }
})
</script>

<template>
  <div ref="root" class="slide-container">
    <div class="slide-content" :style="style">
      <div class="slide-inner" :style="shouldScale ? contentStyle : ''">
        <template v-if="status === SlideStatus.Loading">
          <slot name="loading">
            <SlideLoading />
          </slot>
        </template>
        <template v-else-if="status === SlideStatus.Error">
          <slot name="error">
            <SlideError />
          </slot>
        </template>
        <template v-else>
          <slot name="slide" :component="renderedComp.component">
            <component :is="renderedComp.component" />
          </slot>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-content {
  position: relative;
  overflow: hidden;
}

.slides-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center; /* 居中对齐 */
}

.slide-inner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center;
}
</style>
