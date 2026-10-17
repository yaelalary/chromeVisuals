<script setup lang="ts">
import type { CoverSettings, ExportSize } from '../../domain/cover'
import type { LookId } from '../../domain/looks'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import PanelSection from '../ui/PanelSection.vue'
import AppearanceSection from './AppearanceSection.vue'
import ExportSection from './ExportSection.vue'
import FormSection from './FormSection.vue'
import LookPicker from './LookPicker.vue'
import TextSection from './TextSection.vue'

defineProps<{
  settings: CoverSettings
  exporting: boolean
  exportError?: string
  exportDisabled?: boolean
}>()

const emit = defineEmits<{
  update: [patch: CoverSettingsPatch]
  selectLook: [lookId: LookId]
  reshuffle: []
  export: [size: ExportSize]
}>()
</script>

<template>
  <div class="control-panel">
    <PanelSection title="Ambiance">
      <LookPicker :model-value="settings.lookId" @select="emit('selectLook', $event)" />
    </PanelSection>
    <FormSection :settings="settings" @update="emit('update', $event)" @reshuffle="emit('reshuffle')" />
    <AppearanceSection :settings="settings" @update="emit('update', $event)" />
    <TextSection :settings="settings" @update="emit('update', $event)" />
    <ExportSection
      :exporting="exporting"
      :error="exportError"
      :disabled="exportDisabled"
      @export="emit('export', $event)"
    />
  </div>
</template>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  padding: 0 var(--space-5);
}
</style>
