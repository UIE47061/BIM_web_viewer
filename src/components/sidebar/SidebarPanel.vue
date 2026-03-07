<template>
  <div class="sidebar-panel">
    <!-- Header -->
    <div class="sidebar-panel__header">
      <SvgIcon :path="icons.building" :size="22" color="var(--accent-primary)" />
      <span class="sidebar-panel__title">BIM Viewer</span>
    </div>

    <!-- File section (when model loaded) -->
    <div v-if="store.modelLoaded" class="sidebar-panel__section">
      <FileDropZone compact @file-selected="$emit('file-selected', $event)" />
    </div>

    <!-- File upload (when no model) -->
    <div v-if="!store.modelLoaded && !store.isLoading" class="sidebar-panel__section">
      <FileDropZone @file-selected="$emit('file-selected', $event)" />
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading" class="sidebar-panel__section sidebar-panel__loading">
      <div class="loading-spinner-sm" />
      <span>{{ store.loadingMessage || 'Loading model...' }}</span>
    </div>

    <!-- Panel toggles -->
    <div v-if="store.modelLoaded" class="sidebar-panel__toggles">
      <button
        class="sidebar-panel__toggle-btn"
        :class="{ active: store.panelStoreys }"
        @click="store.panelStoreys = !store.panelStoreys"
      >
        <SvgIcon :path="icons.floor" :size="16" />
        <span>Storeys</span>
      </button>
      <button
        class="sidebar-panel__toggle-btn"
        :class="{ active: store.panelCategories }"
        @click="store.panelCategories = !store.panelCategories"
      >
        <SvgIcon :path="icons.category" :size="16" />
        <span>Categories</span>
      </button>
      <button
        class="sidebar-panel__toggle-btn"
        :class="{ active: store.panelProperties }"
        @click="store.panelProperties = !store.panelProperties"
      >
        <SvgIcon :path="icons.property" :size="16" />
        <span>Properties</span>
      </button>
    </div>

    <!-- Footer -->
    <div class="sidebar-panel__footer">
      <span class="sidebar-panel__footer-text">
        {{ store.modelLoaded ? store.totalElements + ' elements' : 'No model loaded' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  mdiOfficeBuildingOutline,
  mdiFloorPlan,
  mdiFormatListBulletedType,
  mdiInformationOutline,
} from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import FileDropZone from '@/components/common/FileDropZone.vue'

const store = useViewerStore()

const icons = {
  building: mdiOfficeBuildingOutline,
  floor: mdiFloorPlan,
  category: mdiFormatListBulletedType,
  property: mdiInformationOutline,
}

defineEmits<{
  'file-selected': [file: File]
}>()
</script>

<style scoped>
.sidebar-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  overflow: hidden;
}

.sidebar-panel__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-panel__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.sidebar-panel__section {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-panel__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.loading-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.sidebar-panel__footer {
  margin-top: auto;
  padding: 10px 16px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-panel__footer-text {
  font-size: 11px;
  color: var(--text-muted);
}

.sidebar-panel__toggles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-panel__toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sidebar-panel__toggle-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.sidebar-panel__toggle-btn.active {
  background: var(--bg-surface);
  color: var(--accent-primary);
}
</style>
