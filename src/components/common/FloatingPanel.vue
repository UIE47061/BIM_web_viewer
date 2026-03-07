<template>
  <div
    v-show="modelValue"
    class="floating-panel"
    :style="panelStyle"
    @mousedown="bringToFront"
  >
    <div
      class="floating-panel__header"
      @mousedown="startDrag"
    >
      <span class="floating-panel__title">{{ title }}</span>
      <button
        class="floating-panel__close"
        @click="$emit('update:modelValue', false)"
        @mousedown.stop
      >
        <SvgIcon :path="icons.close" :size="14" />
      </button>
    </div>
    <div class="floating-panel__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { mdiClose } from '@mdi/js'
import SvgIcon from '@/components/common/SvgIcon.vue'

const props = withDefaults(defineProps<{
  title: string
  modelValue: boolean
  initX?: number
  initY?: number
  width?: number
}>(), {
  initX: 10,
  initY: 60,
  width: 300,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const icons = { close: mdiClose }

// --- Shared z-index counter (module-level, shared across all instances) ---
let globalZCounter = 1000
const zIndex = ref(globalZCounter++)

function bringToFront() {
  zIndex.value = globalZCounter++
}

// --- Position & drag ---
const posX = ref(props.initX)
const posY = ref(props.initY)

const panelStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  width: `${props.width}px`,
  zIndex: zIndex.value,
}))

let dragging = false
let offsetX = 0
let offsetY = 0

function startDrag(e: MouseEvent) {
  dragging = true
  offsetX = e.clientX - posX.value
  offsetY = e.clientY - posY.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  bringToFront()
}

function onDrag(e: MouseEvent) {
  if (!dragging) return
  posX.value = Math.max(0, e.clientX - offsetX)
  posY.value = Math.max(0, e.clientY - offsetY)
}

function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.floating-panel {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow: hidden;
}

.floating-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.floating-panel__header:active {
  cursor: grabbing;
}

.floating-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.floating-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.floating-panel__close:hover {
  background: var(--accent-error);
  color: white;
}

.floating-panel__body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
</style>
