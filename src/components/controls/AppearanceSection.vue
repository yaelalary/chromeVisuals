<script setup lang="ts">
import type { CoverSettings } from '../../domain/cover'
import { RANGES } from '../../domain/ranges'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import ColorField from '../ui/ColorField.vue'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'

defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{ update: [patch: CoverSettingsPatch] }>()

const set = useSettingsSetter(emit)
</script>

<template>
  <PanelSection title="Rendu">
    <div class="field-row">
      <ColorField label="Teinte" :model-value="settings.tint" @update:model-value="set('tint', $event)" />
      <ColorField
        label="Fond haut"
        :model-value="settings.backgroundTop"
        @update:model-value="set('backgroundTop', $event)"
      />
      <ColorField
        label="Fond bas"
        :model-value="settings.backgroundBottom"
        @update:model-value="set('backgroundBottom', $event)"
      />
    </div>
    <RangeField
      label="Éclat"
      :model-value="settings.bloom"
      :range="RANGES.bloom"
      @update:model-value="set('bloom', $event)"
    />
    <RangeField
      label="Grain"
      :model-value="settings.grain"
      :range="RANGES.grain"
      @update:model-value="set('grain', $event)"
    />
  </PanelSection>
</template>
