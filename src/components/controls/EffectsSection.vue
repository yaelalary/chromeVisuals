<script setup lang="ts">
import type { CoverSettings } from '../../domain/cover'
import { RANGES } from '../../domain/ranges'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'

defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{ update: [patch: CoverSettingsPatch] }>()

const set = useSettingsSetter(emit)
</script>

<template>
  <PanelSection title="Lumière">
    <RangeField label="Éclat" :model-value="settings.bloom" :range="RANGES.bloom" @update:model-value="set('bloom', $event)" />
    <RangeField
      label="Scintillements"
      :model-value="settings.sparkles"
      :range="RANGES.sparkles"
      @update:model-value="set('sparkles', $event)"
    />
  </PanelSection>
  <PanelSection title="Objectif">
    <RangeField
      label="Aberration chromatique"
      :model-value="settings.aberration"
      :range="RANGES.aberration"
      @update:model-value="set('aberration', $event)"
    />
    <RangeField
      label="Vignette"
      :model-value="settings.vignette"
      :range="RANGES.vignette"
      @update:model-value="set('vignette', $event)"
    />
  </PanelSection>
  <PanelSection title="Texture d'image">
    <RangeField label="Grain" :model-value="settings.grain" :range="RANGES.grain" @update:model-value="set('grain', $event)" />
    <RangeField
      label="Lignes de balayage"
      :model-value="settings.scanlines"
      :range="RANGES.scanlines"
      @update:model-value="set('scanlines', $event)"
    />
  </PanelSection>
</template>
