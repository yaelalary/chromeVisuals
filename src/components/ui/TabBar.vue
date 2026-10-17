<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'
import type { Option } from './options'

const props = defineProps<{
  modelValue: T
  tabs: Option<T>[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const items = computed(() => props.tabs.map((tab) => ({ ...tab, active: tab.value === props.modelValue })))
</script>

<template>
  <div class="tab-bar" role="tablist">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      class="tab-bar__tab"
      :class="{ 'tab-bar__tab--active': item.active }"
      :aria-selected="item.active"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-bar__tab {
  flex: 1 1 auto;
  padding: var(--space-4) var(--space-2);
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-tab);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color var(--transition),
    border-color var(--transition);
}

.tab-bar__tab:hover {
  color: var(--color-text);
}

.tab-bar__tab--active,
.tab-bar__tab--active:hover {
  border-bottom-color: var(--color-accent);
  color: var(--color-text);
}
</style>
