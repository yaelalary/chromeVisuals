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
const variantClass = computed(() => `app-button--${props.variant}`)
</script>

<template>
  <button
    type="button"
    class="app-button"
    :class="variantClass"
    :disabled="isInactive"
    :aria-busy="busy"
    @click="emit('click')"
  >
    <span v-if="busy" class="app-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding: 0 var(--space-4);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--transition),
    border-color var(--transition),
    opacity var(--transition);
}

.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-button--primary {
  border: none;
  background: var(--gradient-chrome-soft);
  color: var(--color-text-inverse);
}

.app-button--primary:not(:disabled):hover {
  opacity: 0.88;
}

.app-button--ghost {
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-text);
}

.app-button--ghost:not(:disabled):hover {
  background: var(--color-surface-hover);
}

.app-button__spinner {
  width: var(--space-3);
  height: var(--space-3);
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
