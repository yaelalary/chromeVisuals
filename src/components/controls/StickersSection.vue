<script setup lang="ts">
import { computed } from 'vue'
import type { StickerId } from '../../domain/stickerShapes'
import type { PlacedSticker, PlacedStickerPatch } from '../../domain/stickers'
import AppButton from '../ui/AppButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'
import PanelSection from '../ui/PanelSection.vue'
import StickerEditor from './StickerEditor.vue'
import StickerLibrary from './StickerLibrary.vue'

const props = defineProps<{
  count: number
  selected: PlacedSticker | null
}>()

const emit = defineEmits<{
  add: [stickerId: StickerId]
  update: [patch: PlacedStickerPatch]
  duplicate: []
  remove: []
  clear: []
}>()

const clearDisabled = computed(() => props.count === 0)
</script>

<template>
  <PanelSection title="Bibliothèque">
    <template #action>
      <AppButton :disabled="clearDisabled" @click="emit('clear')">Tout retirer</AppButton>
    </template>
    <StickerLibrary @add="emit('add', $event)" />
    <InlineMessage>Clique un sticker pour l'ajouter, puis fais-le glisser sur l'image pour le placer.</InlineMessage>
  </PanelSection>
  <PanelSection title="Sticker sélectionné">
    <StickerEditor
      v-if="selected"
      :sticker="selected"
      @update="emit('update', $event)"
      @duplicate="emit('duplicate')"
      @remove="emit('remove')"
    />
    <InlineMessage v-else>Clique un sticker sur l'image pour le modifier. Échap pour désélectionner.</InlineMessage>
  </PanelSection>
</template>
