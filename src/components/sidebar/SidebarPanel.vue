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

    <!-- Categories -->
    <template v-if="store.modelLoaded">
      <StoreyTree
        @toggle-storey="$emit('toggle-storey', $event)"
        @show-all="$emit('show-all-storeys')"
        @hide-all="$emit('hide-all-storeys')"
      />
      <CategoryTree
        @toggle-category="$emit('toggle-category', $event)"
        @show-all="$emit('show-all')"
        @hide-all="$emit('hide-all')"
      />
      <PropertiesPanel />
    </template>

    <!-- Footer -->
    <div class="sidebar-panel__footer">
      <span class="sidebar-panel__footer-text">
        {{ store.modelLoaded ? store.totalElements + ' elements' : 'No model loaded' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiOfficeBuildingOutline } from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import CategoryTree from './CategoryTree.vue'
import StoreyTree from './StoreyTree.vue'
import PropertiesPanel from './PropertiesPanel.vue'

const store = useViewerStore()

const icons = {
  building: mdiOfficeBuildingOutline,
}

defineEmits<{
  'file-selected': [file: File]
  'toggle-category': [name: string]
  'show-all': []
  'hide-all': []
  'toggle-storey': [name: string]
  'show-all-storeys': []
  'hide-all-storeys': []
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
</style>
