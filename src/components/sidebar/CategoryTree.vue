<template>
  <div class="category-tree">
    <!-- Section header -->
    <div class="category-tree__header">
      <button class="section-toggle" @click="expanded = !expanded">
        <SvgIcon
          :path="expanded ? icons.chevronDown : icons.chevronRight"
          :size="16"
        />
        <span>Categories</span>
        <span class="category-tree__count">{{ store.categories.length }}</span>
      </button>
      <div class="category-tree__actions">
        <button
          class="category-tree__action"
          title="Show all"
          @click="$emit('show-all')"
        >
          <SvgIcon :path="icons.eyeOn" :size="14" />
        </button>
        <button
          class="category-tree__action"
          title="Hide all"
          @click="$emit('hide-all')"
        >
          <SvgIcon :path="icons.eyeOff" :size="14" />
        </button>
      </div>
    </div>

    <!-- Category list -->
    <Transition name="slide">
      <div v-if="expanded" class="category-tree__list">
        <ToggleItem
          v-for="cat in store.categories"
          :key="cat.name"
          :label="cat.name"
          :model-value="cat.visible"
          :icon="cat.icon"
          :color="cat.color"
          :count="cat.count"
          @update:model-value="$emit('toggle-category', cat.name)"
        />
        <div v-if="store.categories.length === 0" class="category-tree__empty">
          No categories found
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiChevronDown, mdiChevronRight, mdiEye, mdiEyeOff } from '@mdi/js'
import { useViewerStore } from '@/stores/viewerStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import ToggleItem from '@/components/common/ToggleItem.vue'

const store = useViewerStore()
const expanded = ref(true)

const icons = {
  chevronDown: mdiChevronDown,
  chevronRight: mdiChevronRight,
  eyeOn: mdiEye,
  eyeOff: mdiEyeOff,
}

defineEmits<{
  'toggle-category': [name: string]
  'show-all': []
  'hide-all': []
}>()
</script>

<style scoped>
.category-tree {
}

.category-tree__header {
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

.category-tree__count {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
  font-weight: 400;
}

.category-tree__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.category-tree__action {
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

.category-tree__action:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.category-tree__list {
  padding: 0 4px 8px;
  max-height: 400px;
  overflow-y: auto;
}

.category-tree__empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
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
  max-height: 500px;
}
</style>
