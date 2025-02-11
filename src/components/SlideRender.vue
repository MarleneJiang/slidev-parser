<script setup lang="ts">
import type { PropType } from 'vue'
import type { RendererOptions, SlideSource } from '../index'
import { useElementSize } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { SlideRenderer } from '../index'
import SlideError from './SlideError.vue'
import SlideLoading from './SlideLoading.vue'
import { removeCss, updateDynamicCss } from './utils'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  slide: {
    type: Object as PropType<SlideSource | string>,
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
  transform: `scale(${Math.min(scale.value, 1)})`,
  transformOrigin: 'top left', // 确保从左上角开始缩放
  transition: 'transform 0.1s ease',
  width: `${Math.max(props.slideWidth ?? width.value, width.value)}px`, // 设置内容区域的原始宽度
  height: `${Math.max(props.slideHeight ?? height.value, height.value)}px`, // 设置内容区域的原始高度
}))

const renderedComp = shallowRef()

enum SlideStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

const status = ref<SlideStatus>(SlideStatus.Loading)

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
      updateDynamicCss(css.output.css, `${props.id}-css`)
    }
    status.value = SlideStatus.Loaded
  }
  catch (error) {
    console.error('更新幻灯片时出错:', error)
    status.value = SlideStatus.Error
  }
}

function handleUpdateSlide() {
  !slideRenderer.value && (slideRenderer.value = new SlideRenderer(props.rendererOptions))
  if (typeof props.slide === 'string') {
    const slideArray = SlideRenderer.parse(props.slide)
    if (slideArray && slideArray.length > 0) {
      updateSlide(slideArray[0])
    }
    else {
      console.error('无法解析Slides文本', slideArray)
      status.value = SlideStatus.Error
    }
  }
  else {
    updateSlide(props.slide)
  }
}
onMounted(async () => {
  slideRenderer.value = new SlideRenderer(props.rendererOptions)
  !!props?.rendererOptions?.sfcComponents && (await slideRenderer.value.initSfcComponents(props?.rendererOptions?.sfcComponents))
  handleUpdateSlide()
})
watch(() => props.slide, handleUpdateSlide, { deep: true })
watch(() => props.rendererOptions, async () => {
  slideRenderer.value = new SlideRenderer(props.rendererOptions)
  !!props?.rendererOptions?.sfcComponents && (await slideRenderer.value.initSfcComponents(props?.rendererOptions?.sfcComponents))
  handleUpdateSlide()
}, { deep: true })
onUnmounted(() => {
  removeCss(`${props.id}-css`)
})
</script>

<template>
  <div ref="root" class="slide-container">
    <slot name="global-top" />
    <div class="slide-content" :style="style">
      <div :class="{ 'slide-inner': flexable }" :style="shouldScale ? contentStyle : ''">
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
          <slot name="slide-top" />
          <slot name="slide" :component="renderedComp.component">
            <component :is="renderedComp.component" :id="id" />
          </slot>
          <slot name="slide-bottom" />
        </template>
      </div>
    </div>
    <slot name="global-bottom" />
  </div>
</template>

<style scoped>
.slide-container {
  position: relative;
  /* width: 100%; */
  /* height: 100%; */
}

.slide-content {
  position: relative;
  overflow: hidden;
}

.slide-inner {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
