<template>
  <div class="properties-panel">
    <!-- Section header -->
    <div class="properties-panel__header">
      <button class="section-toggle" @click="expanded = !expanded">
        <SvgIcon
          :path="expanded ? icons.chevronDown : icons.chevronRight"
          :size="16"
        />
        <span>Properties</span>
      </button>
      <button
        v-if="expanded && hasEdits"
        class="properties-panel__download-btn"
        title="Download modified IFC"
        @click="$emit('download')"
      >
        <SvgIcon :path="icons.download" :size="14" />
        <span>Download</span>
      </button>
    </div>

    <!-- Properties content -->
    <Transition name="slide">
      <div v-if="expanded" class="properties-panel__content">
        <!-- No selection -->
        <div v-if="!store.hasSelection" class="properties-panel__empty">
          <SvgIcon :path="icons.cursor" :size="24" color="var(--text-muted)" />
          <p>Click an element to view properties</p>
        </div>

        <!-- Property groups -->
        <template v-else>
          <div
            v-for="group in store.selectedProperties"
            :key="group.name"
            class="property-group"
          >
            <div class="property-group__header">
              <SvgIcon :path="icons.list" :size="14" />
              <span>{{ group.name }}</span>
            </div>
            <div class="property-group__items">
              <div
                v-for="prop in group.properties"
                :key="prop.name"
                class="property-item"
              >
                <span class="property-item__name">{{ prop.name }}</span>
                <!-- Editable value -->
                <template v-if="prop.editable">
                  <input
                    v-if="editingKey === editKey(group.name, prop.name)"
                    ref="editInputRef"
                    class="property-item__input"
                    :value="editValue"
                    @input="editValue = ($event.target as HTMLInputElement).value"
                    @keydown.enter="commitEdit(prop)"
                    @keydown.escape="cancelEdit"
                    @blur="commitEdit(prop)"
                  />
                  <span
                    v-else
                    class="property-item__value property-item__value--editable"
                    :title="String(prop.value)"
                    @dblclick="startEdit(group.name, prop)"
                  >
                    {{ formatValue(prop.value) }}
                    <SvgIcon :path="icons.pencil" :size="10" class="property-item__edit-icon" />
                  </span>
                </template>
                <!-- Read-only value -->
                <span
                  v-else
                  class="property-item__value"
                  :title="String(prop.value)"
                >
                  {{ formatValue(prop.value) }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="store.selectedProperties.length === 0" class="properties-panel__empty">
            <p>No properties available</p>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import {
  mdiChevronDown,
  mdiChevronRight,
  mdiCursorDefaultClickOutline,
  mdiFormatListBulleted,
  mdiPencilOutline,
  mdiDownload,
} from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import type { PropertyItem } from '@/types/ifc'
import SvgIcon from '@/components/common/SvgIcon.vue'

const emit = defineEmits<{
  'edit-property': [psetId: number, propIndex: number, newValue: string | number | boolean]
  download: []
}>()

const store = useViewerStore()
const expanded = ref(true)
const hasEdits = ref(false)

const editingKey = ref<string | null>(null)
const editValue = ref('')
const editInputRef = ref<HTMLInputElement[] | null>(null)

const icons = {
  chevronDown: mdiChevronDown,
  chevronRight: mdiChevronRight,
  cursor: mdiCursorDefaultClickOutline,
  list: mdiFormatListBulleted,
  pencil: mdiPencilOutline,
  download: mdiDownload,
}

function editKey(groupName: string, propName: string): string {
  return `${groupName}::${propName}`
}

function startEdit(groupName: string, prop: PropertyItem) {
  editingKey.value = editKey(groupName, prop.name)
  editValue.value = String(prop.value)
  nextTick(() => {
    const inputs = editInputRef.value
    if (inputs && inputs.length > 0) {
      inputs[0].focus()
      inputs[0].select()
    }
  })
}

function commitEdit(prop: PropertyItem) {
  if (editingKey.value === null) return
  const raw = editValue.value
  const oldStr = String(prop.value)

  // Only emit if value actually changed
  if (raw !== oldStr) {
    // Coerce to original type
    let newVal: string | number | boolean
    if (typeof prop.value === 'boolean') {
      newVal = raw.toLowerCase() === 'true' || raw === '1' || raw.toLowerCase() === 'yes'
    } else if (typeof prop.value === 'number') {
      const parsed = Number(raw)
      newVal = isNaN(parsed) ? raw : parsed
    } else {
      newVal = raw
    }

    prop.value = newVal
    hasEdits.value = true

    if (prop.psetId != null && prop.propIndex != null) {
      emit('edit-property', prop.psetId, prop.propIndex, newVal)
    }
  }

  editingKey.value = null
}

function cancelEdit() {
  editingKey.value = null
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return value.toFixed(4)
  }
  if (typeof value === 'string' && value.length > 60) {
    return value.substring(0, 57) + '...'
  }
  return String(value)
}
</script>

<style scoped>
.properties-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.properties-panel__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.section-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 8px 10px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  width: 100%;
}

.section-toggle:hover {
  color: var(--accent-primary);
}

.properties-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
}

.properties-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;
}

.properties-panel__empty p {
  font-size: 12px;
  color: var(--text-muted);
}

/* Property group */
.property-group {
  margin-bottom: 8px;
}

.property-group__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.property-group__items {
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 10px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.property-item:last-child {
  border-bottom: none;
}

.property-item__name {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.property-item__value {
  font-size: 12px;
  color: var(--text-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.property-item__value--editable {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 2px;
  padding: 0 2px;
}

.property-item__value--editable:hover {
  background: var(--bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.property-item__edit-icon {
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.property-item:hover .property-item__edit-icon {
  opacity: 0.5;
}

.property-item__input {
  width: 100%;
  max-width: 160px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  outline: none;
}

.properties-panel__download-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.properties-panel__download-btn:hover {
  background: var(--accent-primary);
  color: white;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
