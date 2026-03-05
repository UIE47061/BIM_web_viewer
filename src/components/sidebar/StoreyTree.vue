<template>
  <div class="storey-tree">
    <!-- Section header -->
    <div class="storey-tree__header">
      <button class="section-toggle" @click="expanded = !expanded">
        <SvgIcon
          :path="expanded ? icons.chevronDown : icons.chevronRight"
          :size="16"
        />
        <span>Storeys</span>
        <span class="storey-tree__count">{{ store.storeys.length }}</span>
      </button>
      <div class="storey-tree__actions">
        <button
          class="storey-tree__action"
          title="Show all storeys"
          @click="$emit('show-all')"
        >
          <SvgIcon :path="icons.eyeOn" :size="14" />
        </button>
        <button
          class="storey-tree__action"
          title="Hide all storeys"
          @click="$emit('hide-all')"
        >
          <SvgIcon :path="icons.eyeOff" :size="14" />
        </button>
      </div>
    </div>

    <!-- Storey list -->
    <Transition name="slide">
      <div v-if="expanded" class="storey-tree__list">
        <div
          v-for="storey in store.storeys"
          :key="storey.name"
          class="storey-item"
          :class="{ 'storey-item--off': !storey.visible }"
          @click="$emit('toggle-storey', storey.name)"
        >
          <div class="storey-item__left">
            <SvgIcon :path="icons.floor" :size="16" class="storey-item__icon" />
            <span class="storey-item__name">{{ storey.name }}</span>
          </div>
          <div class="storey-item__right">
            <span class="storey-item__count">{{ storey.count }}</span>
            <div class="storey-item__switch" :class="{ on: storey.visible }">
              <div class="storey-item__switch-thumb" />
            </div>
          </div>
        </div>
        <div v-if="store.storeys.length === 0" class="storey-tree__empty">
          No storeys found
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  mdiChevronDown,
  mdiChevronRight,
  mdiEye,
  mdiEyeOff,
  mdiFloorPlan,
} from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import SvgIcon from '@/components/common/SvgIcon.vue'

const store = useViewerStore()
const expanded = ref(true)

const icons = {
  chevronDown: mdiChevronDown,
  chevronRight: mdiChevronRight,
  eyeOn: mdiEye,
  eyeOff: mdiEyeOff,
  floor: mdiFloorPlan,
}

defineEmits<{
  'toggle-storey': [name: string]
  'show-all': []
  'hide-all': []
}>()
</script>

<style scoped>
.storey-tree {
  border-bottom: 1px solid var(--border-color);
}

.storey-tree__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 0;
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
  flex: 1;
}

.section-toggle:hover {
  color: var(--accent-primary);
}

.storey-tree__count {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
  font-weight: 400;
}

.storey-tree__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.storey-tree__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.storey-tree__action:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.storey-tree__list {
  padding: 0 4px 8px;
}

.storey-tree__empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

/* Storey item */
.storey-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  user-select: none;
}

.storey-item:hover {
  background: var(--bg-surface-hover);
}

.storey-item--off {
  opacity: 0.55;
}

.storey-item__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.storey-item__icon {
  flex-shrink: 0;
  color: var(--accent-primary);
}

.storey-item__name {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storey-item__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.storey-item__count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  min-width: 24px;
  text-align: center;
}

/* Toggle switch */
.storey-item__switch {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--bg-surface-active);
  position: relative;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.storey-item__switch.on {
  background: var(--accent-primary);
}

.storey-item__switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: transform var(--transition-fast);
}

.storey-item__switch.on .storey-item__switch-thumb {
  transform: translateX(14px);
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
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 600px;
}
</style>
