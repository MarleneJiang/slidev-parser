<script setup lang="ts">
import type { PropType } from 'vue'
import type { RendererOptions, SlideSource } from '../index'
import { useElementSize } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { SlideRenderer } from '../index'
import SlideError from './SlideError.vue'
import SlideLoading from './SlideLoading.vue'
import { removeCss, updateDynamicCss } from './utils'

const props = defineProps({
  id: {
    type: String,
    default: `slide${Math.random().toString(36).substr(2, 9)}`,
  },
  slides: {
    type: Array as PropType<SlideSource[] | string>,
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

// 是否需要缩放，依据传入的 slideWidth 和 slideHeight 是否有值来判断
const shouldScale = computed(() =>
  props.slideWidth !== undefined && props.slideHeight !== undefined,
)

// 缩放比例
const scale = computed(() => {
  if (props.slideWidth === undefined || props.slideHeight === undefined) {
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

enum SlideStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

interface SlideState {
  status: SlideStatus
  component?: any
  styleId?: string // 为每个Slides添加 styleId
}

const slideStates = ref<SlideState[]>([])

// 更新单个Slides的状态、组件和CSS
async function updateSlide(index: number, slide: SlideSource) {
  try {
    slideStates.value[index].status = SlideStatus.Loading
    const renderedSlide = (await slideRenderer.value!.render([slide]))[0] // 渲染该Slide
    slideStates.value[index].component = renderedSlide

    const css = await renderedSlide.css()
    if (css?.output?.css) {
      const styleId = `${props.id}-css-${index}` // 为每个Slide生成唯一的 styleId
      slideStates.value[index].styleId = styleId
      updateDynamicCss(css.output.css, styleId) // 更新该Slide对应的 CSS
    }

    slideStates.value[index].status = SlideStatus.Loaded
  }
  catch (error) {
    console.error(`更新第 ${index} 个Slides时出错:`, error)
    slideStates.value[index].status = SlideStatus.Error
  }
}

// 对比新旧 slides，只更新发生变化的Slides
function handleSlideUpdates(newSlides: SlideSource[], oldSlides: SlideSource[]) {
  const updates: Promise<void>[] = []

  // 确保 oldSlides 长度与 newSlides 长度一致
  const maxLength = newSlides.length
  const filledOldSlides = [...oldSlides]

  // 如果 oldSlides 长度不足，使用空对象填充
  if (filledOldSlides.length < maxLength) {
    for (let i = filledOldSlides.length; i < maxLength; i++) {
      filledOldSlides.push({ frontmatter: {}, content: '', note: '' } as SlideSource)
    }
  }

  // 遍历 newSlides（以 newSlides 长度为准）
  for (let i = 0; i < maxLength; i++) {
    // 如果 newSlides[i] 和 oldSlides[i] 的 content 或 note 不同，则进行更新
    if (
      newSlides[i].content !== filledOldSlides[i].content
      || newSlides[i].note !== filledOldSlides[i].note
    ) {
      updates.push(updateSlide(i, newSlides[i]))
    }
  }

  // 等待所有更新完成
  return Promise.all(updates)
}

function handleUpdateSlides(newSlides: string | SlideSource[], oldSlides: string | SlideSource[]) {
  !slideRenderer.value && (slideRenderer.value = new SlideRenderer(props.rendererOptions))
  if (typeof newSlides !== typeof oldSlides) {
    console.error('Slides数据类型不一致', newSlides, oldSlides)
    Array.from({ length: (slideStates.value.length) }).forEach((_, index) => {
      slideStates.value[index].status = SlideStatus.Error
    })
  }
  else if (typeof newSlides === 'string' && typeof oldSlides === 'string') {
    const newSlideArray = slideRenderer.value?.parse(newSlides)
    const oldSlideArray = slideRenderer.value?.parse(oldSlides)
    if (newSlideArray && newSlideArray.length > 0 && oldSlideArray && oldSlideArray.length > 0) {
      handleSlideUpdates(newSlideArray, oldSlideArray)
    }
    else {
      console.error('无法解析Slides文本', newSlideArray, oldSlideArray)
      Array.from({ length: (slideStates.value.length) }).forEach((_, index) => {
        slideStates.value[index].status = SlideStatus.Error
      })
    }
  }
  else if (Array.isArray(newSlides) && Array.isArray(oldSlides)) {
    handleSlideUpdates(newSlides, oldSlides)
  }
  else {
    console.error('Slides数据类型不一致', typeof newSlides, typeof oldSlides)
    Array.from({ length: (slideStates.value.length) }).forEach((_, index) => {
      slideStates.value[index].status = SlideStatus.Error
    })
  }
}

onMounted(() => {
  // 组件挂载时直接更新Slides
  slideRenderer.value = new SlideRenderer(props.rendererOptions)
  handleUpdateSlides(props.slides, []) // 初次加载时, 旧数组为空
})

watch(
  () => props.slides,
  (newSlides, oldSlides) => {
    // 对比新旧 slides 数据，只更新发生变化的Slides
    handleUpdateSlides(newSlides, oldSlides)
  },
  { deep: true }, // 深度监听每个Slides的属性变化
)

onUnmounted(() => {
  // 清理所有的 style 元素，防止内存泄漏
  slideStates.value.forEach((slideState) => {
    if (slideState.styleId) {
      removeCss(slideState.styleId)
    }
  })
})
</script>

<template>
  <div ref="root" class="slide-container">
    <div class="slide-content" :style="style">
      <slot name="slides-wrapper" :slides="slideStates">
        <div class="slides-wrapper">
          <div
            v-for="(slide, index) in slideStates"
            :key="index"
            :class="{ 'slide-inner': flexable }"
            :style="shouldScale ? contentStyle : ''"
          >
            <template v-if="slide.status === SlideStatus.Loading">
              <slot name="loading">
                <SlideLoading />
              </slot>
            </template>
            <template v-else-if="slide.status === SlideStatus.Error">
              <slot name="error">
                <SlideError />
              </slot>
            </template>
            <template v-else>
              <slot name="slide" :component="slide.component" :index="index">
                <component :is="slide.component" :id="`${id}-${index}`" />
              </slot>
            </template>
          </div>
        </div>
      </slot>
    </div>
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
