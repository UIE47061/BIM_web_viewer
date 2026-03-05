<template>
  <button
    class="icon-button"
    :class="{ active, disabled }"
    :title="tooltip"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <SvgIcon :path="icon" :size="iconSize" />
    <span v-if="label" class="icon-button__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

withDefaults(defineProps<{
  icon: string
  tooltip?: string
  label?: string
  active?: boolean
  disabled?: boolean
  iconSize?: number
}>(), {
  tooltip: '',
  label: '',
  active: false,
  disabled: false,
  iconSize: 18,
})

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.icon-button:hover:not(.disabled) {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.icon-button.active {
  background: var(--accent-primary);
  color: white;
}

.icon-button.active:hover {
  background: var(--accent-primary-hover);
}

.icon-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-button__label {
  font-size: 12px;
}
</style>
