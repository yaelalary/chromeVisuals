import { randomBetween, type Random } from './random'
import type { StickerId } from './stickerShapes'
import { clamp } from './vector'

export type StickerFinish = 'flat' | 'chrome'

export const STICKER_FINISHES: Record<StickerFinish, { label: string }> = {
  flat: { label: 'Uni' },
  chrome: { label: 'Chrome' },
}

/** Sticker posé sur la cover ; x, y au centre et size relatifs à la largeur du cadre, rotation en degrés. */
export interface PlacedSticker {
  id: string
  stickerId: StickerId
  x: number
  y: number
  size: number
  rotation: number
  color: string
  finish: StickerFinish
  opacity: number
}

export type PlacedStickerPatch = Partial<Omit<PlacedSticker, 'id' | 'stickerId'>>

const DEFAULT_SIZE = 0.18
const PLACEMENT_SPREAD = 0.15
const DUPLICATE_OFFSET = 0.04

export function placeSticker(id: string, stickerId: StickerId, random: Random): PlacedSticker {
  return {
    id,
    stickerId,
    x: 0.5 + randomBetween(random, -PLACEMENT_SPREAD, PLACEMENT_SPREAD),
    y: 0.5 + randomBetween(random, -PLACEMENT_SPREAD, PLACEMENT_SPREAD),
    size: DEFAULT_SIZE,
    rotation: 0,
    color: '#ffffff',
    finish: 'chrome',
    opacity: 1,
  }
}

export function clampStickerPosition(value: number): number {
  return clamp(value, 0, 1)
}

export function updatePlacedSticker(
  stickers: readonly PlacedSticker[],
  id: string,
  patch: PlacedStickerPatch,
): PlacedSticker[] {
  return stickers.map((sticker) => (sticker.id === id ? { ...sticker, ...patch } : sticker))
}

export function removePlacedSticker(stickers: readonly PlacedSticker[], id: string): PlacedSticker[] {
  return stickers.filter((sticker) => sticker.id !== id)
}

/** Copie le sticker juste à côté de l'original, au premier plan. */
export function duplicatePlacedSticker(stickers: readonly PlacedSticker[], id: string, newId: string): PlacedSticker[] {
  const original = stickers.find((sticker) => sticker.id === id)
  if (!original) return [...stickers]
  return [
    ...stickers,
    {
      ...original,
      id: newId,
      x: clampStickerPosition(original.x + DUPLICATE_OFFSET),
      y: clampStickerPosition(original.y + DUPLICATE_OFFSET),
    },
  ]
}

export function bringStickerToFront(stickers: readonly PlacedSticker[], id: string): PlacedSticker[] {
  const target = stickers.find((sticker) => sticker.id === id)
  return target ? [...stickers.filter((sticker) => sticker.id !== id), target] : [...stickers]
}
