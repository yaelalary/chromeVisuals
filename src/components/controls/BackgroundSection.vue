<script setup lang="ts">
import { computed } from 'vue'
import type { CoverSettings } from '../../domain/cover'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import { useBackgroundSwatches } from '../../composables/useSwatches'
import ColorField from '../ui/ColorField.vue'
import PanelSection from '../ui/PanelSection.vue'
import SwatchPicker from '../ui/SwatchPicker.vue'

const props = defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{ update: [patch: CoverSettingsPatch] }>()

const set = useSettingsSetter(emit)
const colors = computed(() => ({ top: props.settings.backgroundTop, bottom: props.settings.backgroundBottom }))
const backgroundSwatches = useBackgroundSwatches(colors)
</script>

<template>
  <PanelSection title="Fond">
    <SwatchPicker
      label="Style"
      :model-value="settings.backgroundStyle"
      :options="backgroundSwatches"
      @update:model-value="set('backgroundStyle', $event)"
    />
    <div class="field-row">
      <ColorField
        label="Couleur 1"
        :model-value="settings.backgroundTop"
        @update:model-value="set('backgroundTop', $event)"
      />
      <ColorField
        label="Couleur 2"
        :model-value="settings.backgroundBottom"
        @update:model-value="set('backgroundBottom', $event)"
      />
    </div>
  </PanelSection>
</template>
