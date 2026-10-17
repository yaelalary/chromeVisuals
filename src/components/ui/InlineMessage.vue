<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'muted' | 'danger' }>(), { tone: 'muted' })

const toneClass = computed(() => `inline-message--${props.tone}`)
const role = computed(() => (props.tone === 'danger' ? 'alert' : undefined))
</script>

<template>
  <p class="inline-message" :class="toneClass" :role="role">
    <slot />
  </p>
</template>

<style scoped>
.inline-message {
  margin: 0;
  font-size: var(--text-xs);
  line-height: 1.5;
}

.inline-message--muted {
  color: var(--color-text-muted);
}

.inline-message--danger {
  color: var(--color-danger);
}
</style>
