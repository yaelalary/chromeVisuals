<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="color-field">
    <input type="color" :value="modelValue" @input="onInput" />
    <span class="field__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.color-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
  cursor: pointer;
}
</style>
