<template>
  <div
    class="toggle-item"
    :class="{ 'toggle-item--off': !modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div class="toggle-item__color" :style="{ backgroundColor: color }" />
    <SvgIcon v-if="icon" :path="icon" :size="16" class="toggle-item__icon" />
    <span class="toggle-item__label">{{ label }}</span>
    <span v-if="count !== undefined" class="toggle-item__count">{{ count }}</span>
    <div class="toggle-item__switch" :class="{ on: modelValue }">
      <div class="toggle-item__switch-thumb" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

withDefaults(defineProps<{
  label: string
  modelValue: boolean
  icon?: string
  color?: string
  count?: number
}>(), {
  icon: '',
  color: '#94a3b8',
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.toggle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  user-select: none;
}

.toggle-item:hover {
  background: var(--bg-surface-hover);
}

.toggle-item--off {
  opacity: 0.55;
}

.toggle-item__color {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

.toggle-item__icon {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.toggle-item__label {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-item__count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 1px 6px;
  border-radius: 8px;
  min-width: 24px;
  text-align: center;
}

/* Toggle Switch */
.toggle-item__switch {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--bg-surface-active);
  position: relative;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.toggle-item__switch.on {
  background: var(--accent-primary);
}

.toggle-item__switch-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--transition-fast);
}

.toggle-item__switch.on .toggle-item__switch-thumb {
  transform: translateX(14px);
}
</style>
