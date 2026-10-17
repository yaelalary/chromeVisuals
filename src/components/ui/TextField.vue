<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input type="text" :value="modelValue" :placeholder="placeholder" @input="onInput" />
  </label>
</template>
