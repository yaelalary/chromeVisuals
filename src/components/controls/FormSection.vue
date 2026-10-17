<script setup lang="ts">
import { computed } from 'vue'
import { SHAPES, type CoverSettings } from '../../domain/cover'
import { SYMMETRIES } from '../../domain/symmetry'
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

const SHAPE_COLUMNS = 4

const set = useSettingsSetter(emit)
const shapeOptions = optionsFrom(SHAPES)
const symmetryOptions = optionsFrom(SYMMETRIES)
const controls = computed(() => new Set(SHAPES[props.settings.shapeId].controls))
const usesDensity = computed(() => controls.value.has('density'))
const usesThickness = computed(() => controls.value.has('thickness'))
const usesChaos = computed(() => controls.value.has('chaos'))
const usesSymmetry = computed(() => controls.value.has('symmetry'))
const reshuffleDisabled = computed(() => controls.value.size === 0)
const isDrawn = computed(() => props.settings.shapeId === 'drawn')
</script>

<template>
  <PanelSection title="Forme">
    <template #action>
      <AppButton :disabled="reshuffleDisabled" @click="emit('reshuffle')">Nouvelle variation</AppButton>
    </template>
    <SegmentedControl
      label="Motif"
      :model-value="settings.shapeId"
      :options="shapeOptions"
      :columns="SHAPE_COLUMNS"
      @update:model-value="set('shapeId', $event)"
    />
    <InlineMessage v-if="isDrawn">
      Dessine sur l'image à gauche. L'épaisseur, le chaos et la symétrie s'appliquent à tous tes traits.
    </InlineMessage>
    <SegmentedControl
      v-if="usesSymmetry"
      label="Symétrie"
      :model-value="settings.symmetry"
      :options="symmetryOptions"
      @update:model-value="set('symmetry', $event)"
    />
    <RangeField
      v-if="usesDensity"
      label="Densité"
      :model-value="settings.density"
      :range="RANGES.density"
      @update:model-value="set('density', $event)"
    />
    <RangeField
      v-if="usesThickness"
      label="Épaisseur"
      :model-value="settings.thickness"
      :range="RANGES.thickness"
      @update:model-value="set('thickness', $event)"
    />
    <RangeField
      v-if="usesChaos"
      label="Chaos"
      :model-value="settings.chaos"
      :range="RANGES.chaos"
      @update:model-value="set('chaos', $event)"
    />
  </PanelSection>
</template>
