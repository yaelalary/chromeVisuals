<script setup lang="ts">
import { computed, ref } from 'vue'
import { STICKERS } from '../../domain/stickerShapes'
import type { PlacedSticker } from '../../domain/stickers'
import { useStickerDrag } from '../../composables/useStickerDrag'

const props = defineProps<{
  stickers: readonly PlacedSticker[]
  selectedId: string | null
  interactive: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  move: [id: string, x: number, y: number]
}>()

const surface = ref<HTMLElement>()
const { onPointerDown, onPointerMove, onPointerUp } = useStickerDrag(surface, {
  onSelect: (id) => emit('select', id),
  onMove: (id, x, y) => emit('move', id, x, y),
})

const handles = computed(() =>
  props.stickers.map((sticker) => ({
    sticker,
    label: STICKERS[sticker.stickerId].label,
    selected: sticker.id === props.selectedId,
    style: {
      left: `${sticker.x * 100}%`,
      top: `${sticker.y * 100}%`,
      width: `${sticker.size * 100}%`,
      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
    },
  })),
)
</script>

<template>
  <div ref="surface" class="sticker-handles" :class="{ 'sticker-handles--interactive': interactive }">
    <button
      v-for="handle in handles"
      :key="handle.sticker.id"
      type="button"
      class="sticker-handle"
      :class="{ 'sticker-handle--selected': handle.selected }"
      :style="handle.style"
      :aria-label="`Déplacer : ${handle.label}`"
      :aria-pressed="handle.selected"
      @pointerdown="onPointerDown($event, handle.sticker)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
  </div>
</template>

<style scoped>
.sticker-handles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sticker-handle {
  position: absolute;
  aspect-ratio: 1;
  padding: 0;
  border: 1px dashed transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  pointer-events: none;
  touch-action: none;
  cursor: move;
  transition: border-color var(--transition);
}

.sticker-handles--interactive .sticker-handle {
  pointer-events: auto;
}

.sticker-handles--interactive .sticker-handle:hover {
  border-color: var(--color-sticker-hover);
}

.sticker-handle--selected,
.sticker-handles--interactive .sticker-handle--selected:hover {
  border-color: var(--color-sticker-selected);
}
</style>
