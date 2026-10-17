<script setup lang="ts">
import { computed } from 'vue'
import { BRUSH_PROFILES, DRAWING_MODES, type Brush, type DrawingMode } from '../../domain/drawing'
import { RANGES } from '../../domain/ranges'
import AppButton from '../ui/AppButton.vue'
import RangeField from '../ui/RangeField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import { optionsFrom } from '../ui/options'

const props = defineProps<{
  mode: DrawingMode
  brush: Brush
  canUndo: boolean
}>()

const emit = defineEmits<{
  'update:mode': [mode: DrawingMode]
  updateBrush: [patch: Partial<Brush>]
  undo: []
  clear: []
}>()

const modeOptions = optionsFrom(DRAWING_MODES)
const profileOptions = optionsFrom(BRUSH_PROFILES)
const historyDisabled = computed(() => !props.canUndo)
</script>

<template>
  <div class="drawing-toolbar">
    <SegmentedControl
      label="Outil"
      :model-value="mode"
      :options="modeOptions"
      @update:model-value="emit('update:mode', $event)"
    />
    <SegmentedControl
      label="Pinceau"
      :model-value="brush.profile"
      :options="profileOptions"
      @update:model-value="emit('updateBrush', { profile: $event })"
    />
    <RangeField
      label="Taille du pinceau"
      :model-value="brush.size"
      :range="RANGES.brushSize"
      @update:model-value="emit('updateBrush', { size: $event })"
    />
    <div class="drawing-toolbar__actions">
      <AppButton :disabled="historyDisabled" title="Ctrl+Z" @click="emit('undo')">Annuler</AppButton>
      <AppButton :disabled="historyDisabled" @click="emit('clear')">Effacer</AppButton>
    </div>
  </div>
</template>

<style scoped>
.drawing-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(140px, 1fr) auto;
  align-items: end;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.drawing-toolbar__actions {
  display: flex;
  gap: var(--space-2);
}

@media (max-width: 1200px) {
  .drawing-toolbar {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
