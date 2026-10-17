<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    accept: string
    variant?: 'primary' | 'ghost'
    busy?: boolean
  }>(),
  { variant: 'ghost', busy: false },
)

const emit = defineEmits<{ select: [file: File] }>()

const buttonClasses = computed(() => [`button--${props.variant}`, { 'button--disabled': props.busy }])

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('select', file)
}
</script>

<template>
  <label class="button file-button" :class="buttonClasses" :aria-busy="busy">
    <input type="file" class="file-button__input" :accept="accept" :disabled="busy" @change="onChange" />
    <span v-if="busy" class="button__spinner" aria-hidden="true" />
    <slot />
  </label>
</template>

<style scoped>
.file-button {
  position: relative;
}

.file-button:focus-within {
  box-shadow: var(--focus-ring);
}

.file-button__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
