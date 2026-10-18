<script setup lang="ts">
import { computed } from 'vue'
import { RANGES } from '../../domain/ranges'
import { STICKERS } from '../../domain/stickerShapes'
import { STICKER_FINISHES, type PlacedSticker, type PlacedStickerPatch } from '../../domain/stickers'
import { createPatchSetter } from '../../composables/settingsPatch'
import AppButton from '../ui/AppButton.vue'
import ColorField from '../ui/ColorField.vue'
import RangeField from '../ui/RangeField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import { optionsFrom } from '../ui/options'

const props = defineProps<{ sticker: PlacedSticker }>()

const emit = defineEmits<{
  update: [patch: PlacedStickerPatch]
  duplicate: []
  remove: []
}>()

const finishOptions = optionsFrom(STICKER_FINISHES)
const name = computed(() => STICKERS[props.sticker.stickerId].label)
const usesColor = computed(() => props.sticker.finish === 'flat')

const set = createPatchSetter<PlacedStickerPatch>((patch) => emit('update', patch))
</script>

<template>
  <div class="sticker-editor">
    <div class="sticker-editor__header">
      <span class="sticker-editor__name">{{ name }}</span>
      <div class="sticker-editor__actions">
        <AppButton @click="emit('duplicate')">Dupliquer</AppButton>
        <AppButton title="Touche Suppr" @click="emit('remove')">Supprimer</AppButton>
      </div>
    </div>
    <div class="sticker-editor__finish">
      <SegmentedControl
        label="Finition"
        :model-value="sticker.finish"
        :options="finishOptions"
        @update:model-value="set('finish', $event)"
      />
      <ColorField v-if="usesColor" label="Couleur" :model-value="sticker.color" @update:model-value="set('color', $event)" />
    </div>
    <RangeField label="Taille" :model-value="sticker.size" :range="RANGES.stickerSize" @update:model-value="set('size', $event)" />
    <RangeField
      label="Rotation"
      :model-value="sticker.rotation"
      :range="RANGES.stickerRotation"
      @update:model-value="set('rotation', $event)"
    />
    <RangeField
      label="Opacité"
      :model-value="sticker.opacity"
      :range="RANGES.stickerOpacity"
      @update:model-value="set('opacity', $event)"
    />
  </div>
</template>

<style scoped>
.sticker-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sticker-editor__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.sticker-editor__name {
  font-size: var(--text-sm);
  font-weight: 600;
}

.sticker-editor__actions {
  display: flex;
  gap: var(--space-2);
}

.sticker-editor__finish {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: var(--space-4);
}
</style>
