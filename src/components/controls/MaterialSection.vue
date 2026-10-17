<script setup lang="ts">
import { computed } from 'vue'
import type { CoverSettings } from '../../domain/cover'
import { RANGES } from '../../domain/ranges'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import { useTextureSwatches } from '../../composables/useSwatches'
import ColorField from '../ui/ColorField.vue'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'
import SwatchPicker from '../ui/SwatchPicker.vue'

const props = defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{ update: [patch: CoverSettingsPatch] }>()

const set = useSettingsSetter(emit)
const textureSwatches = useTextureSwatches()
const isTextured = computed(() => props.settings.surfaceTexture !== 'smooth')
</script>

<template>
  <PanelSection title="Matière">
    <ColorField label="Teinte du métal" :model-value="settings.tint" @update:model-value="set('tint', $event)" />
    <SwatchPicker
      label="Texture"
      :model-value="settings.surfaceTexture"
      :options="textureSwatches"
      @update:model-value="set('surfaceTexture', $event)"
    />
    <template v-if="isTextured">
      <RangeField
        label="Intensité"
        :model-value="settings.textureStrength"
        :range="RANGES.textureStrength"
        @update:model-value="set('textureStrength', $event)"
      />
      <RangeField
        label="Échelle"
        :model-value="settings.textureScale"
        :range="RANGES.textureScale"
        @update:model-value="set('textureScale', $event)"
      />
    </template>
  </PanelSection>
</template>
