import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import type { StickerId } from '../domain/stickerShapes'
import {
  bringStickerToFront,
  clampStickerPosition,
  duplicatePlacedSticker,
  placeSticker,
  removePlacedSticker,
  updatePlacedSticker,
  type PlacedStickerPatch,
} from '../domain/stickers'
import type { CoverSettingsPatch } from './useCoverSettings'

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const DELETE_KEYS = new Set(['Delete', 'Backspace'])

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable)
}

function createStickerId(): string {
  return crypto.randomUUID()
}

/** Stickers posés sur la cover et sélection en cours ; la sélection est un état d'interface, pas de la cover. */
export function useStickers(settings: Readonly<Ref<CoverSettings>>, update: (patch: CoverSettingsPatch) => void) {
  const selectedId = ref<string | null>(null)

  const selected = computed(() => settings.value.stickers.find((sticker) => sticker.id === selectedId.value) ?? null)

  function setStickers(stickers: CoverSettings['stickers']): void {
    update({ stickers })
  }

  function addSticker(stickerId: StickerId): void {
    const sticker = placeSticker(createStickerId(), stickerId, Math.random)
    setStickers([...settings.value.stickers, sticker])
    selectedId.value = sticker.id
  }

  function selectSticker(id: string | null): void {
    selectedId.value = id
    if (id) setStickers(bringStickerToFront(settings.value.stickers, id))
  }

  function moveSticker(id: string, x: number, y: number): void {
    setStickers(updatePlacedSticker(settings.value.stickers, id, { x: clampStickerPosition(x), y: clampStickerPosition(y) }))
  }

  function updateSelected(patch: PlacedStickerPatch): void {
    if (selectedId.value) setStickers(updatePlacedSticker(settings.value.stickers, selectedId.value, patch))
  }

  function duplicateSelected(): void {
    if (!selectedId.value) return
    const newId = createStickerId()
    setStickers(duplicatePlacedSticker(settings.value.stickers, selectedId.value, newId))
    selectedId.value = newId
  }

  function removeSelected(): void {
    if (!selectedId.value) return
    setStickers(removePlacedSticker(settings.value.stickers, selectedId.value))
    selectedId.value = null
  }

  function clearStickers(): void {
    setStickers([])
    selectedId.value = null
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!selectedId.value || isEditableTarget(event.target)) return
    if (DELETE_KEYS.has(event.key)) {
      event.preventDefault()
      removeSelected()
    } else if (event.key === 'Escape') {
      selectedId.value = null
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return {
    selectedId,
    selected,
    addSticker,
    selectSticker,
    moveSticker,
    updateSelected,
    duplicateSelected,
    removeSelected,
    clearStickers,
  }
}
