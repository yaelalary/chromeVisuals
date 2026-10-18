import { onBeforeUnmount, watch, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import { paintCoverText, TEXT_INPUT_KEYS } from '../render/coverText'
import { EFFECT_INPUT_KEYS, paintEffects } from '../render/effectsOverlay'
import { FrameScheduler } from '../render/frameScheduler'
import { paintGrain } from '../render/grain'
import { paintStickers } from '../render/stickerPainter'
import { ensureFontLoaded } from '../services/fontService'

type CanvasRef = Ref<HTMLCanvasElement | undefined>

export interface OverlayCanvases {
  grain: CanvasRef
  effects: CanvasRef
  stickers: CanvasRef
  text: CanvasRef
}

function pickKeys<K extends keyof CoverSettings>(settings: CoverSettings, keys: readonly K[]): Pick<CoverSettings, K> {
  return Object.fromEntries(keys.map((key) => [key, settings[key]])) as Pick<CoverSettings, K>
}

/** Prépare un calque vierge ; le canvas n'est réalloué que si sa taille change. */
function prepareContext(canvas: HTMLCanvasElement, size: number): CanvasRenderingContext2D | null {
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size
    canvas.height = size
  }
  const context = canvas.getContext('2d')
  context?.clearRect(0, 0, size, size)
  return context
}

/**
 * Calques 2D de l'aperçu (grain, effets, stickers, texte), peints avec les mêmes fonctions que l'export.
 * Les repeints sont regroupés à l'image suivante : glisser un sticker ne repeint qu'une fois par image.
 */
export function useCoverOverlays(canvases: OverlayCanvases, settings: Readonly<Ref<CoverSettings>>, pixelSize: Ref<number>) {
  const sources = <K extends keyof CoverSettings>(keys: readonly K[]) => keys.map((key) => () => settings.value[key])
  const scheduler = new FrameScheduler()
  onBeforeUnmount(() => scheduler.dispose())

  watch([canvases.grain, () => settings.value.grain, pixelSize], ([canvas, amount, size]) => {
    if (canvas && size > 0) scheduler.schedule('grain', () => paintGrain(canvas, size, amount))
  })

  watch([canvases.effects, pixelSize, ...sources(EFFECT_INPUT_KEYS)], ([canvas, size]) => {
    if (!canvas || size <= 0) return
    scheduler.schedule('effects', () => {
      const context = prepareContext(canvas, size)
      if (context) paintEffects(context, pickKeys(settings.value, EFFECT_INPUT_KEYS), size)
    })
  })

  watch([canvases.stickers, pixelSize, () => settings.value.stickers], ([canvas, size]) => {
    if (!canvas || size <= 0) return
    scheduler.schedule('stickers', () => {
      const context = prepareContext(canvas, size)
      if (context) paintStickers(context, settings.value.stickers, size)
    })
  })

  let paintRequest = 0
  watch([canvases.text, pixelSize, ...sources(TEXT_INPUT_KEYS)], async ([canvas, size]) => {
    if (!canvas || size <= 0) return
    const input = pickKeys(settings.value, TEXT_INPUT_KEYS)
    const request = ++paintRequest
    await ensureFontLoaded(input.fontId, input.title + input.subtitle)
    if (request !== paintRequest) return
    const context = prepareContext(canvas, size)
    if (context) paintCoverText(context, input, size)
  })
}
