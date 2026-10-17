<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost'
    busy?: boolean
    disabled?: boolean
  }>(),
  { variant: 'ghost', busy: false, disabled: false },
)

const emit = defineEmits<{ click: [] }>()

const isInactive = computed(() => props.disabled || props.busy)
const variantClass = computed(() => `button--${props.variant}`)
</script>

<template>
  <button type="button" class="button" :class="variantClass" :disabled="isInactive" :aria-busy="busy" @click="emit('click')">
    <span v-if="busy" class="button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
