<script setup lang="ts">
import type { StickerId } from '../../domain/stickerShapes'
import { useStickerSwatches } from '../../composables/useSwatches'

const emit = defineEmits<{ add: [stickerId: StickerId] }>()

const stickers = useStickerSwatches()
</script>

<template>
  <div class="swatch-grid sticker-library" role="list" aria-label="Bibliothèque de stickers">
    <button
      v-for="sticker in stickers"
      :key="sticker.value"
      type="button"
      role="listitem"
      class="swatch"
      :title="sticker.label"
      :aria-label="`Ajouter : ${sticker.label}`"
      @click="emit('add', sticker.value)"
    >
      <span class="swatch__preview">
        <img class="swatch__image" :src="sticker.imageUrl" alt="" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.sticker-library {
  --swatch-columns: 6;
}
</style>
