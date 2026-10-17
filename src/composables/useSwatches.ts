import { computed, ref, watchEffect, type Ref } from 'vue'
import { BACKGROUND_STYLES, type BackgroundStyleId } from '../domain/backgrounds'
import { SURFACE_TEXTURES, type SurfaceTextureId } from '../domain/surfaceTextures'
import { backgroundThumbnail, textureThumbnail } from '../render/thumbnails'
import type { Swatch } from '../components/ui/options'

const THUMBNAIL_SEED = 11

let textureSwatchCache: Swatch<SurfaceTextureId>[] | null = null

/** Vignettes des textures de surface ; elles ne dépendent d'aucun réglage, on les calcule une fois. */
export function useTextureSwatches() {
  textureSwatchCache ??= (Object.keys(SURFACE_TEXTURES) as SurfaceTextureId[]).map((id) => ({
    value: id,
    label: SURFACE_TEXTURES[id].label,
    imageUrl: textureThumbnail(id),
  }))
  return computed(() => textureSwatchCache ?? [])
}

/** Vignettes des fonds, repeintes avec les couleurs choisies. */
export function useBackgroundSwatches(colors: Ref<{ top: string; bottom: string }>) {
  const swatches = ref<Swatch<BackgroundStyleId>[]>([])
  watchEffect(() => {
    const { top, bottom } = colors.value
    swatches.value = (Object.keys(BACKGROUND_STYLES) as BackgroundStyleId[]).map((id) => ({
      value: id,
      label: BACKGROUND_STYLES[id].label,
      imageUrl: backgroundThumbnail(id, { top, bottom }, THUMBNAIL_SEED),
    }))
  })
  return swatches
}
