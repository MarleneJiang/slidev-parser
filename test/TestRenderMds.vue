<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import { renderMds } from '../src/index'

const slidesSource = [
  {
    frontmatter: {
      layout: 'cover',
    },
    content: `# Hello\n\nThis is a slide{.mt-5}\n\nCompiled in the **browser**\n::card
  The content of the card{style="color: green;" .custom-class .green}!
  ::\n<test/>`,
    note: '',
  },
]
const comp = shallowRef()
const css = ref()
onMounted(async () => {
  const slides = renderMds(slidesSource)
  css.value = (await slides[0].css()).output.getLayer()
  comp.value = await slides[0]
})
</script>

<template>
  <div v-if="comp">
    {{ css }}
    <component :is="comp.component" />
  </div>
</template>

<style>

</style>
