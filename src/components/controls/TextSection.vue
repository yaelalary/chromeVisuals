<script setup lang="ts">
import { computed } from 'vue'
import { TEXT_POSITIONS, TEXT_STYLES, type CoverSettings } from '../../domain/cover'
import { FONTS } from '../../domain/fonts'
import { RANGES } from '../../domain/ranges'
import { useSettingsSetter } from '../../composables/settingsPatch'
import type { CoverSettingsPatch } from '../../composables/useCoverSettings'
import ColorField from '../ui/ColorField.vue'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import SelectField from '../ui/SelectField.vue'
import TextField from '../ui/TextField.vue'
import { optionsFrom } from '../ui/options'

const props = defineProps<{ settings: CoverSettings }>()

const emit = defineEmits<{ update: [patch: CoverSettingsPatch] }>()

const set = useSettingsSetter(emit)
const usesTextColor = computed(() => props.settings.textStyle === 'plain')
const fontOptions = optionsFrom(FONTS)
const positionOptions = optionsFrom(TEXT_POSITIONS)
const styleOptions = optionsFrom(TEXT_STYLES)
</script>

<template>
  <PanelSection title="Texte">
    <TextField
      label="Titre"
      placeholder="Titre du morceau"
      :model-value="settings.title"
      @update:model-value="set('title', $event)"
    />
    <TextField
      label="Sous-titre"
      placeholder="Artiste"
      :model-value="settings.subtitle"
      @update:model-value="set('subtitle', $event)"
    />
    <SelectField
      label="Police"
      :model-value="settings.fontId"
      :options="fontOptions"
      @update:model-value="set('fontId', $event)"
    />
    <SegmentedControl
      label="Position"
      :model-value="settings.textPosition"
      :options="positionOptions"
      @update:model-value="set('textPosition', $event)"
    />
    <div class="text-section__style">
      <SegmentedControl
        label="Style"
        :model-value="settings.textStyle"
        :options="styleOptions"
        @update:model-value="set('textStyle', $event)"
      />
      <ColorField
        v-if="usesTextColor"
        label="Couleur"
        :model-value="settings.textColor" @update:model-value="set('textColor', $event)" />
    </div>
    <RangeField
      label="Taille"
      :model-value="settings.textScale"
      :range="RANGES.textScale"
      @update:model-value="set('textScale', $event)"
    />
  </PanelSection>
</template>

<style scoped>
.text-section__style {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: var(--space-4);
}
</style>
