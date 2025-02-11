<script setup lang="ts">
import type { PropType } from 'vue'
import type { RendererOptions, SlideSource } from '../index'
import { useElementSize } from '@vueuse/core'
import { computed, markRaw, onMounted, onUnmounted, ref, watch } from 'vue'
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
  transform: `scale(${Math.min(scale.value, 1)})`,
  transformOrigin: 'top left', // 确保从左上角开始缩放
  transition: 'transform 0.1s ease',
  width: `${Math.max(props.slideWidth ?? width.value, width.value)}px`, // 设置内容区域的原始宽度
  height: `${Math.max(props.slideHeight ?? height.value, height.value)}px`, // 设置内容区域的原始高度
}))

enum SlideStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

interface SlideState {
  status: SlideStatus
  renderData?: any
  styleId?: string // 为每个Slides添加 styleId
}

const slideStates = ref<SlideState[]>([])

// 更新单个Slides的状态、组件和CSS
async function updateSlide(index: number, slide: SlideSource) {
  try {
    slideStates.value[index].status = SlideStatus.Loading
    const renderedSlide = (await slideRenderer.value!.render([slide]))[0] // 渲染该Slide
    // 修改：使用 markRaw 包裹渲染结果以避免响应式开销
    slideStates.value[index].renderData = markRaw(renderedSlide)
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

// 新增：初始化 slideRenderer 的公共逻辑
async function initSlideRenderer() {
  slideRenderer.value = new SlideRenderer(props.rendererOptions)
  if (props.rendererOptions?.sfcComponents) {
    await slideRenderer.value.initSfcComponents(props.rendererOptions.sfcComponents)
  }
}

// 优化：统一处理 slides 更新的逻辑
function handleUpdateSlides(newSlides: string | SlideSource[], oldSlides: string | SlideSource[]) {
  if (typeof newSlides !== typeof oldSlides) {
    console.error('Slides数据类型不一致', newSlides, oldSlides)
    slideStates.value.forEach(slideState => slideState.status = SlideStatus.Error)
    return
  }
  if (typeof newSlides === 'string') {
    const newSlideArray = SlideRenderer.parse(newSlides)
    const oldSlideArray = SlideRenderer.parse(oldSlides as string)
    if (!newSlideArray?.length || !oldSlideArray?.length) {
      console.error('无法解析Slides文本', newSlideArray, oldSlideArray)
      slideStates.value.forEach(slideState => slideState.status = SlideStatus.Error)
      return
    }
    handleSlideUpdates(newSlideArray, oldSlideArray)
  }
  else if (Array.isArray(newSlides)) {
    // 若状态数组长度不足，则扩充到新数组长度
    while (slideStates.value.length < newSlides.length) {
      slideStates.value.push({ status: SlideStatus.Loading })
    }
    handleSlideUpdates(newSlides, oldSlides as SlideSource[])
  }
}

onMounted(async () => {
  await initSlideRenderer()
  // 初次更新 slides，此时旧数组为空
  handleUpdateSlides(props.slides, [])
})
watch(() => props.rendererOptions, async () => {
  await initSlideRenderer()
  handleUpdateSlides(props.slides, [])
}, { deep: true })

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
  <div ref="root" class="slides-container">
    <slot name="slides-wrapper" :slides="slideStates">
      <div v-for="(slide, index) in slideStates" :key="index" class="slides-wrapper" :style="style">
        <div class="absolute top-0 right-0 px2 py1 border-b border-l rounded-lb bg-main border-main select-none">
          <div class="text-xs op50">
            {{ index }}
          </div>
        </div>
        <div :class="{ 'slide-inner': flexable }" :style="shouldScale ? contentStyle : ''">
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
            <slot name="slide" :component="slide.renderData.component" :index="index">
              <component :is="slide.renderData.component" :id="`${id}-${index}`" />
            </slot>
          </template>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.slides-container {
  position: relative;
  margin: 1rem;
  /* width: 100%; */
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 16px;
  justify-content: center;
  /* 居中对齐 */
}

.slide-content {
  position: relative;
  overflow: hidden;
}

.slides-wrapper {
  @apply border rounded border-main overflow-hidden bg-main select-none h-max relative;
}

.slide-inner {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
