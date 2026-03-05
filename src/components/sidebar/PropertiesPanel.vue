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
                <span class="property-item__value" :title="String(prop.value)">
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
import { ref } from 'vue'
import {
  mdiChevronDown,
  mdiChevronRight,
  mdiCursorDefaultClickOutline,
  mdiFormatListBulleted,
} from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import SvgIcon from '@/components/common/SvgIcon.vue'

const store = useViewerStore()
const expanded = ref(true)

const icons = {
  chevronDown: mdiChevronDown,
  chevronRight: mdiChevronRight,
  cursor: mdiCursorDefaultClickOutline,
  list: mdiFormatListBulleted,
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
