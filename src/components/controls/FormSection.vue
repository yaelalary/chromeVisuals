<script setup lang="ts">
import { computed } from 'vue'
import { SHAPES, type CoverSettings } from '../../domain/cover'
import { RANGES } from '../../domain/ranges'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import AppButton from '../ui/AppButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import { optionsFrom } from '../ui/options'

const props = defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{
  update: [patch: CoverSettingsPatch]
  reshuffle: []
}>()

const SHAPE_COLUMNS = 3

const set = useSettingsSetter(emit)
const shapeOptions = optionsFrom(SHAPES)
const usesDensity = computed(() => SHAPES[props.settings.shapeId].usesDensity)
const isDrawn = computed(() => props.settings.shapeId === 'drawn')
</script>

<template>
  <PanelSection title="Forme">
    <template #action>
      <AppButton @click="emit('reshuffle')">Nouvelle variation</AppButton>
    </template>
    <SegmentedControl
      label="Motif"
      :model-value="settings.shapeId"
      :options="shapeOptions"
      :columns="SHAPE_COLUMNS"
      @update:model-value="set('shapeId', $event)"
    />
    <InlineMessage v-if="isDrawn">
      Dessine sur l'image à gauche. L'épaisseur et le chaos s'appliquent à tous tes traits.
    </InlineMessage>
    <RangeField
      v-if="usesDensity"
      label="Densité"
      :model-value="settings.density"
      :range="RANGES.density"
      @update:model-value="set('density', $event)"
    />
    <RangeField
      label="Épaisseur"
      :model-value="settings.thickness"
      :range="RANGES.thickness"
      @update:model-value="set('thickness', $event)"
    />
    <RangeField
      label="Chaos"
      :model-value="settings.chaos"
      :range="RANGES.chaos"
      @update:model-value="set('chaos', $event)"
    />
  </PanelSection>
</template>
