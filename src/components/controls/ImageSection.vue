<script setup lang="ts">
import { computed } from 'vue'
import {
  IMAGE_COLORS,
  IMAGE_KEEPS,
  IMAGE_TREATMENTS,
  usesLuminanceMask,
  type ImageLayer,
} from '../../domain/imageLayer'
import { RANGES } from '../../domain/ranges'
import type { ImageLayerPatch } from '../../composables/useCoverSettings'
import { createPatchSetter } from '../../composables/settingsPatch'
import AppButton from '../ui/AppButton.vue'
import FileButton from '../ui/FileButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'
import PanelSection from '../ui/PanelSection.vue'
import RangeField from '../ui/RangeField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import { optionsFrom } from '../ui/options'

const props = defineProps<{
  image: ImageLayer | null
  importing: boolean
  importError?: string
}>()

const emit = defineEmits<{
  import: [file: File]
  update: [patch: ImageLayerPatch]
  remove: []
}>()

const ACCEPTED_FILES = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif'

const treatmentOptions = optionsFrom(IMAGE_TREATMENTS)
const colorOptions = optionsFrom(IMAGE_COLORS)
const keepOptions = optionsFrom(IMAGE_KEEPS)

const needsThreshold = computed(() => !!props.image && usesLuminanceMask(props.image))

const set = createPatchSetter<ImageLayerPatch>((patch) => emit('update', patch))
</script>

<template>
  <PanelSection title="Image">
    <template v-if="image">
      <div class="image-asset">
        <img class="image-asset__preview" :src="image.asset.previewUrl" alt="" />
        <span class="image-asset__name">{{ image.asset.name }}</span>
        <div class="image-asset__actions">
          <FileButton :accept="ACCEPTED_FILES" :busy="importing" @select="emit('import', $event)">Remplacer</FileButton>
          <AppButton @click="emit('remove')">Retirer</AppButton>
        </div>
      </div>
      <SegmentedControl
        label="Traitement"
        :model-value="image.treatment"
        :options="treatmentOptions"
        @update:model-value="set('treatment', $event)"
      />
      <template v-if="needsThreshold">
        <SegmentedControl
          label="Partie à garder"
          :model-value="image.keep"
          :options="keepOptions"
          @update:model-value="set('keep', $event)"
        />
        <RangeField
          label="Seuil"
          :model-value="image.threshold"
          :range="RANGES.imageThreshold"
          @update:model-value="set('threshold', $event)"
        />
      </template>
      <SegmentedControl
        label="Couleurs"
        :model-value="image.colors"
        :options="colorOptions"
        @update:model-value="set('colors', $event)"
      />
      <RangeField
        label="Taille"
        :model-value="image.scale"
        :range="RANGES.imageScale"
        @update:model-value="set('scale', $event)"
      />
      <RangeField
        label="Relief"
        :model-value="image.depth"
        :range="RANGES.imageDepth"
        @update:model-value="set('depth', $event)"
      />
      <RangeField
        label="Position horizontale"
        :model-value="image.offsetX"
        :range="RANGES.imageOffset"
        @update:model-value="set('offsetX', $event)"
      />
      <RangeField
        label="Position verticale"
        :model-value="image.offsetY"
        :range="RANGES.imageOffset"
        @update:model-value="set('offsetY', $event)"
      />
    </template>
    <template v-else>
      <FileButton variant="primary" :accept="ACCEPTED_FILES" :busy="importing" @select="emit('import', $event)">
        Importer une image
      </FileButton>
      <InlineMessage>
        Un PNG transparent (logo, lettrage, objet détouré) donne le plus beau rendu chrome. Les photos marchent en
        traitement Relief.
      </InlineMessage>
    </template>
    <InlineMessage v-if="importError" tone="danger">{{ importError }}</InlineMessage>
  </PanelSection>
</template>

<style scoped>
.image-asset {
  display: grid;
  grid-template-columns: var(--thumbnail-size) 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: var(--space-2) var(--space-3);
}

.image-asset__preview {
  grid-row: span 2;
  width: var(--thumbnail-size);
  height: var(--thumbnail-size);
  object-fit: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: repeating-conic-gradient(var(--color-surface-raised) 0 25%, var(--color-border) 0 50%) 0 0 /
    var(--checker-size) var(--checker-size);
}

.image-asset__name {
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-asset__actions {
  display: flex;
  gap: var(--space-2);
}
</style>
