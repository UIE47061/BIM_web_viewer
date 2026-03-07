<template>
  <div class="viewer-toolbar">
    <!-- Left group -->
    <div class="viewer-toolbar__group">
      <IconButton
        :icon="icons.fitScreen"
        tooltip="Fit to model"
        @click="$emit('fit')"
      />
      <IconButton
        :icon="icons.resetView"
        tooltip="Reset view"
        @click="$emit('reset-view')"
      />
      <div class="viewer-toolbar__divider" />
      <IconButton
        :icon="icons.grid"
        tooltip="Toggle grid"
        :active="store.showGrid"
        @click="$emit('toggle-grid')"
      />
      <IconButton
        :icon="icons.axes"
        tooltip="Toggle axes"
        :active="store.showAxes"
        @click="$emit('toggle-axes')"
      />
      <IconButton
        :icon="icons.wireframe"
        tooltip="Toggle wireframe"
        :active="store.wireframeMode"
        @click="$emit('toggle-wireframe')"
      />
      <div class="viewer-toolbar__divider" />
      <div class="viewer-toolbar__upaxis">
        <span class="viewer-toolbar__upaxis-label">朝上軸</span>
        <select
          class="upaxis-select"
          :value="store.upAxis"
          @change="$emit('set-up-axis', ($event.target as HTMLSelectElement).value)"
        >
          <option value="X+">X+</option>
          <option value="X-">X−</option>
          <option value="Y+">Y+</option>
          <option value="Y-">Y−</option>
          <option value="Z+">Z+</option>
          <option value="Z-">Z−</option>
        </select>
      </div>
    </div>

    <!-- Center: file info -->
    <div v-if="store.modelLoaded" class="viewer-toolbar__info">
      <SvgIcon :path="icons.file" :size="14" />
      <span class="viewer-toolbar__filename">{{ store.modelStats.fileName }}</span>
      <span class="viewer-toolbar__filesize">({{ formatFileSize(store.modelStats.fileSize) }})</span>
    </div>

    <!-- Right group -->
    <div class="viewer-toolbar__group">
      <div class="viewer-toolbar__divider" />
      <!-- DRC buttons (only when model loaded) -->
      <template v-if="store.modelLoaded">
        <IconButton
          :icon="icons.drc"
          tooltip="Design Rule Check 設計規則檢查"
          label="DRC"
          :active="drc.panelOpen"
          :icon-size="16"
          @click="drc.togglePanel()"
        />
        <IconButton
          v-if="drc.result"
          :icon="icons.clearDrc"
          tooltip="清除 DRC 結果"
          :icon-size="16"
          @click="$emit('clear-drc')"
        />
      </template>
      <div class="viewer-toolbar__divider" />
      <IconButton
        v-if="store.modelLoaded"
        :icon="icons.upload"
        tooltip="Open another file"
        @click="$emit('open-file')"
      />
      <IconButton
        :icon="icons.sidebar"
        tooltip="Toggle sidebar"
        :active="!store.sidebarCollapsed"
        @click="$emit('toggle-sidebar')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  mdiFullscreen,
  mdiRestore,
  mdiGrid,
  mdiAxisArrow,
  mdiVectorLine,
  mdiFileOutline,
  mdiFolderOpenOutline,
  mdiPageLayoutSidebarLeft,
  mdiCheckDecagram,
  mdiEraserVariant,
} from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import { useDrcStore } from '@/stores/drcStore'
import IconButton from '@/components/common/IconButton.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

const store = useViewerStore()
const drc = useDrcStore()

const icons = {
  fitScreen: mdiFullscreen,
  resetView: mdiRestore,
  grid: mdiGrid,
  axes: mdiAxisArrow,
  wireframe: mdiVectorLine,
  file: mdiFileOutline,
  upload: mdiFolderOpenOutline,
  sidebar: mdiPageLayoutSidebarLeft,
  drc: mdiCheckDecagram,
  clearDrc: mdiEraserVariant,
}

defineEmits<{
  fit: []
  'reset-view': []
  'toggle-grid': []
  'toggle-axes': []
  'toggle-wireframe': []
  'open-file': []
  'toggle-sidebar': []
  'set-up-axis': [axis: 'X+' | 'X-' | 'Y+' | 'Y-' | 'Z+' | 'Z-']
  'run-drc': []
  'clear-drc': []
}>()

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--toolbar-height);
  padding: 0 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  z-index: 20;
  flex-shrink: 0;
}

.viewer-toolbar__group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.viewer-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

.viewer-toolbar__info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

.viewer-toolbar__filename {
  color: var(--text-primary);
  font-weight: 500;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-toolbar__filesize {
  color: var(--text-muted);
}

.viewer-toolbar__upaxis {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
}

.viewer-toolbar__upaxis-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-right: 2px;
  white-space: nowrap;
}

.upaxis-select {
  height: 26px;
  padding: 0 4px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.upaxis-select:hover,
.upaxis-select:focus {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}
</style>
