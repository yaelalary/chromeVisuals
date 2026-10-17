<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CoverSettings, ExportSize } from '../../domain/cover'
import type { LookId } from '../../domain/looks'
import type { CoverSettingsPatch, ImageLayerPatch } from '../../composables/useCoverSettings'
import PanelSection from '../ui/PanelSection.vue'
import TabBar from '../ui/TabBar.vue'
import type { Option } from '../ui/options'
import BackgroundSection from './BackgroundSection.vue'
import EffectsSection from './EffectsSection.vue'
import ExportSection from './ExportSection.vue'
import FormSection from './FormSection.vue'
import ImageSection from './ImageSection.vue'
import LookPicker from './LookPicker.vue'
import MaterialSection from './MaterialSection.vue'
import TextSection from './TextSection.vue'

type PanelTab = 'composition' | 'material' | 'effects' | 'text'

defineProps<{
  settings: CoverSettings
  exporting: boolean
  exportError?: string
  exportDisabled?: boolean
  importing: boolean
  importError?: string
}>()

const emit = defineEmits<{
  update: [patch: CoverSettingsPatch]
  selectLook: [lookId: LookId]
  reshuffle: []
  export: [size: ExportSize]
  importImage: [file: File]
  updateImage: [patch: ImageLayerPatch]
  removeImage: []
}>()

const TABS: Option<PanelTab>[] = [
  { value: 'composition', label: 'Composition' },
  { value: 'material', label: 'Matière' },
  { value: 'effects', label: 'Effets' },
  { value: 'text', label: 'Texte' },
]

const activeTab = ref<PanelTab>('composition')
const showsComposition = computed(() => activeTab.value === 'composition')
const showsMaterial = computed(() => activeTab.value === 'material')
const showsEffects = computed(() => activeTab.value === 'effects')
</script>

<template>
  <div class="control-panel">
    <TabBar v-model="activeTab" :tabs="TABS" />
    <div class="control-panel__content">
      <template v-if="showsComposition">
        <PanelSection title="Ambiance">
          <LookPicker :model-value="settings.lookId" @select="emit('selectLook', $event)" />
        </PanelSection>
        <FormSection :settings="settings" @update="emit('update', $event)" @reshuffle="emit('reshuffle')" />
        <ImageSection
          :image="settings.image"
          :importing="importing"
          :import-error="importError"
          @import="emit('importImage', $event)"
          @update="emit('updateImage', $event)"
          @remove="emit('removeImage')"
        />
      </template>
      <template v-else-if="showsMaterial">
        <MaterialSection :settings="settings" @update="emit('update', $event)" />
        <BackgroundSection :settings="settings" @update="emit('update', $event)" />
      </template>
      <EffectsSection v-else-if="showsEffects" :settings="settings" @update="emit('update', $event)" />
      <TextSection v-else :settings="settings" @update="emit('update', $event)" />
    </div>
    <footer class="control-panel__footer">
      <ExportSection
        :exporting="exporting"
        :error="exportError"
        :disabled="exportDisabled"
        @export="emit('export', $event)"
      />
    </footer>
  </div>
</template>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.control-panel__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-5);
}

.control-panel__footer {
  padding: 0 var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

@media (max-width: 900px) {
  .control-panel__content {
    overflow-y: visible;
  }
}
</style>
