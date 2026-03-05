<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path :d="path" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  path: string
  size?: number
  color?: string
}>(), {
  size: 20,
  color: 'currentColor',
})
</script>
