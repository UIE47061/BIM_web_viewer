<template>
  <div
    class="file-drop-zone"
    :class="{
      'file-drop-zone--active': isDragging,
      'file-drop-zone--compact': compact,
    }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="openFilePicker"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".ifc"
      class="file-drop-zone__input"
      @change="onFileSelected"
    />
    <div v-if="!compact" class="file-drop-zone__content">
      <SvgIcon :path="uploadIcon" :size="48" class="file-drop-zone__icon" />
      <p class="file-drop-zone__title">
        {{ isDragging ? 'Drop IFC file here' : 'Open IFC File' }}
      </p>
      <p class="file-drop-zone__subtitle">
        Drag & drop or click to browse
      </p>
      <p class="file-drop-zone__hint">.ifc files supported</p>
    </div>
    <div v-else class="file-drop-zone__compact-content">
      <SvgIcon :path="uploadIcon" :size="16" />
      <span>Open IFC file...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiCloudUploadOutline } from '@mdi/js'
import SvgIcon from './SvgIcon.vue'

const uploadIcon = mdiCloudUploadOutline

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const emit = defineEmits<{
  'file-selected': [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
let dragCounter = 0

function openFilePicker() {
  fileInput.value?.click()
}

function onDragEnter() {
  dragCounter++
  isDragging.value = true
}

function onDragOver(e: DragEvent) {
  e.dataTransfer!.dropEffect = 'copy'
}

function onDragLeave() {
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  dragCounter = 0
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.toLowerCase().endsWith('.ifc')) {
      emit('file-selected', file)
    }
  }
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    emit('file-selected', input.files[0])
    input.value = '' // Reset to allow re-selecting same file
  }
}
</script>

<style scoped>
.file-drop-zone {
  position: relative;
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: center;
}

.file-drop-zone:not(.file-drop-zone--compact) {
  padding: 40px 24px;
}

.file-drop-zone:hover {
  border-color: var(--accent-primary);
  background: rgba(124, 58, 237, 0.05);
}

.file-drop-zone--active {
  border-color: var(--accent-primary);
  background: rgba(124, 58, 237, 0.1);
  transform: scale(1.01);
}

.file-drop-zone__input {
  display: none;
}

.file-drop-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-drop-zone__icon {
  color: var(--text-muted);
  margin-bottom: 8px;
}

.file-drop-zone--active .file-drop-zone__icon,
.file-drop-zone:hover .file-drop-zone__icon {
  color: var(--accent-primary);
}

.file-drop-zone__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.file-drop-zone__subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-drop-zone__hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Compact mode */
.file-drop-zone--compact {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border-style: solid;
  border-width: 1px;
}

.file-drop-zone__compact-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
