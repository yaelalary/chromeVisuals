import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { BACKGROUND_STYLES, type BackgroundStyleId } from '../domain/backgrounds'
import { STICKERS, type StickerId } from '../domain/stickerShapes'
import { SURFACE_TEXTURES, type SurfaceTextureId } from '../domain/surfaceTextures'
import { backgroundThumbnail, stickerThumbnail, textureThumbnail } from '../render/thumbnails'
import type { Swatch } from '../components/ui/options'

const THUMBNAIL_SEED = 11
const BACKGROUND_THUMBNAIL_DELAY_MS = 200

let textureSwatchCache: Swatch<SurfaceTextureId>[] | null = null
let stickerSwatchCache: Swatch<StickerId>[] | null = null

/** Vignettes des textures de surface ; elles ne dépendent d'aucun réglage, on les calcule une fois. */
export function useTextureSwatches() {
  textureSwatchCache ??= (Object.keys(SURFACE_TEXTURES) as SurfaceTextureId[]).map((id) => ({
    value: id,
    label: SURFACE_TEXTURES[id].label,
    imageUrl: textureThumbnail(id),
  }))
  return computed(() => textureSwatchCache ?? [])
}

function paintBackgroundSwatches(top: string, bottom: string): Swatch<BackgroundStyleId>[] {
  return (Object.keys(BACKGROUND_STYLES) as BackgroundStyleId[]).map((id) => ({
    value: id,
    label: BACKGROUND_STYLES[id].label,
    imageUrl: backgroundThumbnail(id, { top, bottom }, THUMBNAIL_SEED),
  }))
}

/**
 * Vignettes des fonds, repeintes avec les couleurs choisies. Elles ne suivent que ces deux couleurs,
 * et attendent une courte pause : une pipette qu'on fait glisser ne les recalcule pas à chaque pas.
 */
export function useBackgroundSwatches(colors: Ref<{ top: string; bottom: string }>) {
  const swatches = ref(paintBackgroundSwatches(colors.value.top, colors.value.bottom))
  let timer = 0

  watch([() => colors.value.top, () => colors.value.bottom], ([top, bottom]) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      swatches.value = paintBackgroundSwatches(top, bottom)
    }, BACKGROUND_THUMBNAIL_DELAY_MS)
  })

  onBeforeUnmount(() => window.clearTimeout(timer))

  return swatches
}

/** Vignettes de la bibliothèque de stickers, calculées une fois. */
export function useStickerSwatches() {
  stickerSwatchCache ??= (Object.keys(STICKERS) as StickerId[]).map((id) => ({
    value: id,
    label: STICKERS[id].label,
    imageUrl: stickerThumbnail(id),
  }))
  return computed(() => stickerSwatchCache ?? [])
}
