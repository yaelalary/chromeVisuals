<script setup lang="ts">
import { computed } from 'vue'
import { clampToRange, type NumericRange } from '../../domain/ranges'

const props = defineProps<{
  label: string
  modelValue: number
  range: NumericRange
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const displayValue = computed(() => props.modelValue.toFixed(props.range.decimals))

function onInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', clampToRange(raw, props.range))
}
</script>

<template>
  <label class="field">
    <span class="field__header">
      <span class="field__label">{{ label }}</span>
      <span class="field__value">{{ displayValue }}</span>
    </span>
    <input type="range" :min="range.min" :max="range.max" :step="range.step" :value="modelValue" @input="onInput" />
  </label>
</template>
