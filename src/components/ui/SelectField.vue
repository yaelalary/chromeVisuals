<script setup lang="ts" generic="T extends string">
import type { Option } from './options'

defineProps<{
  label: string
  modelValue: T
  options: Option<T>[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value as T)
}
</script>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <select :value="modelValue" @change="onChange">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </label>
</template>
