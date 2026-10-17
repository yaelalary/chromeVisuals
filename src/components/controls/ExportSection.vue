<script setup lang="ts">
import { ref } from 'vue'
import { EXPORT_SIZES, type ExportSize } from '../../domain/cover'
import AppButton from '../ui/AppButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import type { Option } from '../ui/options'

defineProps<{
  exporting: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ export: [size: ExportSize] }>()

const size = ref<ExportSize>(EXPORT_SIZES[EXPORT_SIZES.length - 1])
const sizeOptions: Option<ExportSize>[] = EXPORT_SIZES.map((value) => ({ value, label: `${value} px` }))
</script>

<template>
  <section class="export-section">
    <div class="export-section__row">
      <SegmentedControl label="Export PNG" v-model="size" :options="sizeOptions" />
      <AppButton variant="primary" :busy="exporting" :disabled="disabled" @click="emit('export', size)">
        Télécharger
      </AppButton>
    </div>
    <InlineMessage v-if="error" tone="danger">{{ error }}</InlineMessage>
    <InlineMessage v-else>3000 px : format demandé par Spotify, Apple Music et DistroKid.</InlineMessage>
  </section>
</template>

<style scoped>
.export-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) 0;
}

.export-section__row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: var(--space-3);
}
</style>
