<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="panel-section">
    <header class="panel-section__header">
      <h2 class="panel-section__title">{{ title }}</h2>
      <slot name="action" />
    </header>
    <div class="panel-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--color-border);
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.panel-section__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.panel-section__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
