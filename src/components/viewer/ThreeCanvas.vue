<template>
  <div ref="canvasContainer" class="three-canvas">
    <!-- Loading overlay -->
    <Transition name="fade">
      <div v-if="store.isLoading" class="three-canvas__loading">
        <div class="loading-spinner" />
        <p class="loading-text">{{ store.loadingMessage || 'Loading...' }}</p>
        <div v-if="store.loadingProgress > 0" class="loading-bar">
          <div
            class="loading-bar__fill"
            :style="{ width: store.loadingProgress + '%' }"
          />
        </div>
        <p class="loading-percent">{{ store.loadingProgress }}%</p>
      </div>
    </Transition>

    <!-- Empty state (shown when no model loaded and not loading) -->
    <Transition name="fade">
      <div v-if="!store.modelLoaded && !store.isLoading" class="three-canvas__empty">
        <FileDropZone @file-selected="$emit('file-selected', $event)" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useViewerStore } from '@/stores/viewerStore'
import { SceneService } from '@/services/SceneService'
import FileDropZone from '@/components/common/FileDropZone.vue'

const store = useViewerStore()

const canvasContainer = ref<HTMLElement | null>(null)
let sceneService: SceneService | null = null
let resizeObserver: ResizeObserver | null = null

defineEmits<{
  'file-selected': [file: File]
}>()

function getSceneService(): SceneService | null {
  return sceneService
}

onMounted(() => {
  if (!canvasContainer.value) return

  sceneService = new SceneService(canvasContainer.value)

  // ResizeObserver for responsive canvas
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        sceneService?.setSize(width, height)
      }
    }
  })
  resizeObserver.observe(canvasContainer.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  sceneService?.dispose()
  sceneService = null
})

defineExpose({ getSceneService })
</script>

<style scoped>
.three-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

.three-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* Loading overlay */
.three-canvas__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.loading-bar {
  width: 240px;
  height: 4px;
  background: var(--bg-surface);
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar__fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-percent {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* Empty state */
.three-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  z-index: 5;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
