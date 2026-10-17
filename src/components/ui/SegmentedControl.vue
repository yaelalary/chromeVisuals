<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'
import type { Option } from './options'

const props = defineProps<{
  label: string
  modelValue: T
  options: Option<T>[]
  columns?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const items = computed(() => props.options.map((option) => ({ ...option, active: option.value === props.modelValue })))
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns ?? props.options.length}, minmax(0, 1fr))`,
}))
</script>

<template>
  <div class="field">
    <span class="field__label">{{ label }}</span>
    <div class="segmented" role="radiogroup" :aria-label="label" :style="gridStyle">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        role="radio"
        class="segmented__option"
        :class="{ 'segmented__option--active': item.active }"
        :aria-checked="item.active"
        @click="emit('update:modelValue', item.value)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.segmented {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.segmented__option {
  min-width: 0;
  padding: var(--space-2) var(--space-1);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    background var(--transition),
    color var(--transition);
}

.segmented__option:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.segmented__option--active,
.segmented__option--active:hover {
  background: var(--gradient-chrome-soft);
  color: var(--color-text-inverse);
  font-weight: 600;
}
</style>
