import type { CoverSettings } from '../domain/cover'
import { ensureFontLoaded } from '../services/fontService'
import { paintCoverText } from './coverText'
import { paintEffects } from './effectsOverlay'
import { GRAIN_BLEND_MODE, paintGrain } from './grain'
import { paintStickers } from './stickerPainter'

/** Superpose les calques de la cover dans le même ordre que l'aperçu : scène 3D, grain, effets, stickers, texte. */
export async function composeCover(scene: HTMLCanvasElement, settings: CoverSettings, size: number): Promise<HTMLCanvasElement> {
  const output = document.createElement('canvas')
  output.width = size
  output.height = size
  const context = output.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponible')

  context.drawImage(scene, 0, 0, size, size)

  const grain = document.createElement('canvas')
  paintGrain(grain, size, settings.grain)
  context.globalCompositeOperation = GRAIN_BLEND_MODE
  context.drawImage(grain, 0, 0)
  context.globalCompositeOperation = 'source-over'

  const effects = document.createElement('canvas')
  effects.width = size
  effects.height = size
  const effectsContext = effects.getContext('2d')
  if (effectsContext) paintEffects(effectsContext, settings, size)
  context.drawImage(effects, 0, 0)
  paintStickers(context, settings.stickers, size)

  await ensureFontLoaded(settings.fontId, settings.title + settings.subtitle)
  paintCoverText(context, settings, size)
  return output
}
