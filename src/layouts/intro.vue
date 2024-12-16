<template>
  <div class="slidev-layout intro">
    <slot />
  </div>
</template>

<style>
.slidev-layout.intro {
  @apply h-full grid;

  h1 {
    @apply text-6xl leading-20;
  }

  h1+p {
    @apply -mt-2 opacity-50 mb-4;
  }

  p+h2,
  ul+h2,
  table+h2 {
    @apply mt-10;
  }
}
</style>
