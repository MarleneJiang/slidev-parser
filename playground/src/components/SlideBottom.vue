<script setup lang="ts">
/**
 * A new glow effect system powered by blured polygons
 *
 * Credits to @pi0 @Atinux
 *
 * Properties:
 * - glow: 'left' | 'right' | 'top' | 'bottom' | 'full' -  Distribution of the polygons points
 * - glowOpacity: number - Opacity of the polygons (4)
 * - glowHue: number - Hue shift for the polygons (default: 0)
 * - glowSeed: string | false - Seed for the stable random distribution (default: 'default')
 */
import type { PropType } from 'vue'
import seedrandom from 'seedrandom'
import { computed, ref, watch } from 'vue'

interface SlideRoute {
  no: number
  meta: {
    slide: {
      frontmatter: {
        glow: string
        glowOpacity: number
        glowHue: number
        glowSeed: string | false
      }
    }
  }
}
const props = defineProps({
  currentSlideRoute: {
    type: Object as PropType<SlideRoute>,
    required: true,
  },
})
export type Range = [number, number]

export type Distribution =
  | 'full'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const formatter = computed(() => (props.currentSlideRoute?.meta?.slide as any)?.frontmatter || {})
const distribution = computed(() => (formatter.value.glow || 'full') as Distribution)
const opacity = computed<number>(() => +(formatter.value.glowOpacity || 0.4))
const hue = computed<number>(() => +(formatter.value.glowHue || 0))
const seed = computed<string>(() => (formatter.value.glowSeed === 'false' || formatter.value.glowSeed === false)
  ? Date.now().toString()
  : formatter.value.glowSeed || 'default',
)
const overflow = 0.3
const disturb = 0.3
const disturbChance = 0.3

function distributionToLimits(distribution: Distribution) {
  const min = -0.2
  const max = 1.2
  let x: Range = [min, max]
  let y: Range = [min, max]

  function intersection(a: Range, b: Range): Range {
    return [Math.max(a[0], b[0]), Math.min(a[1], b[1])]
  }

  const limits = distribution.split('-')

  for (const limit of limits) {
    switch (limit) {
      case 'top':
        y = intersection(y, [min, 0.6])
        break
      case 'bottom':
        y = intersection(y, [0.4, max])
        break
      case 'left':
        x = intersection(x, [min, 0.6])
        break
      case 'right':
        x = intersection(x, [0.4, max])
        break
      case 'xcenter':
        x = intersection(x, [0.25, 0.75])
        break
      case 'ycenter':
        y = intersection(y, [0.25, 0.75])
        break
      case 'center':
        x = intersection(x, [0.25, 0.75])
        y = intersection(y, [0.25, 0.75])
        break
      case 'full':
        x = intersection(x, [0, 1])
        y = intersection(y, [0, 1])
        break
      default:
        break
    }
  }

  return { x, y }
}

function distance2([x1, y1]: Range, [x2, y2]: Range) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2
}

function usePloy(number = 16) {
  function getPoints(): Range[] {
    const limits = distributionToLimits(distribution.value)
    const rng = seedrandom(`${seed.value}-${props.currentSlideRoute.no}`)
    function randomBetween([a, b]: Range) {
      return rng() * (b - a) + a
    }
    function applyOverflow(initialRandom: number, overflowValue: number) {
      const newRandom = initialRandom * (1 + overflowValue * 2) - overflowValue
      return rng() < disturbChance ? newRandom + (rng() - 0.5) * disturb : newRandom
    }
    return Array.from({ length: number })
      .fill(0)
      .map(() => [
        applyOverflow(randomBetween(limits.x), overflow),
        applyOverflow(randomBetween(limits.y), overflow),
      ])
  }

  const points = ref(getPoints())
  const poly = computed(() => points.value.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(', '))

  function jumpPoints() {
    const newPoints = new Set(getPoints())
    points.value = points.value.map((o) => {
      let minDistance = Number.POSITIVE_INFINITY
      let closest: Range | undefined
      for (const n of newPoints) {
        const d = distance2(o, n)
        if (d < minDistance) {
          minDistance = d
          closest = n
        }
      }
      if (closest) {
        newPoints.delete(closest)
      }
      return closest || o
    })
  }

  watch(props, () => {
    jumpPoints()
  })

  return poly
}

const poly1 = usePloy(10)
const poly2 = usePloy(6)
const poly3 = usePloy(3)
</script>

<template>
  <div
    class="bg transform-gpu overflow-hidden pointer-events-none bg-slate-100 dark:bg-slate-900"
    :style="{ filter: `blur(70px) hue-rotate(${hue}deg)` }"
    aria-hidden="true"
  >
    <div
      class="clip bg-gradient-to-r dark:from-[#2f96ad] from-sky-200 dark:to-white/10 to-sky-100/30"
      :style="{ 'clip-path': `polygon(${poly1})`, 'opacity': opacity }"
    />
    <div
      class="clip bg-gradient-to-l dark:from-[#4B32C3] from-blue-200 dark:to-white/10 to-blue-100/30"
      :style="{ 'clip-path': `polygon(${poly2})`, 'opacity': opacity }"
    />
    <div
      class="clip bg-gradient-to-t dark:from-[#8080f2] from-indigo-200 dark:to-white/10 to-indigo-100/30"
      :style="{ 'clip-path': `polygon(${poly3})`, 'opacity': 0.2 }"
    />
  </div>
</template>

<style scoped>
.bg,
.clip {
  transition: all 2.5s ease;
}

.bg {
  position: absolute;
  inset: 0;
  z-index: -10;
}

.clip {
  clip-path: circle(75%);
  aspect-ratio: 16 / 9;
  position: absolute;
  inset: 0;
}

.light .clip {
  opacity: 1 !important;
}
</style>
