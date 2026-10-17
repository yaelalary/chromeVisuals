import { watch, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import { paintCoverText, TEXT_INPUT_KEYS } from '../render/coverText'
import { EFFECT_INPUT_KEYS, paintEffects } from '../render/effectsOverlay'
import { paintGrain } from '../render/grain'
import { ensureFontLoaded } from '../services/fontService'

type CanvasRef = Ref<HTMLCanvasElement | undefined>

export interface OverlayCanvases {
  grain: CanvasRef
  effects: CanvasRef
  text: CanvasRef
}

function pickKeys<K extends keyof CoverSettings>(settings: CoverSettings, keys: readonly K[]): Pick<CoverSettings, K> {
  return Object.fromEntries(keys.map((key) => [key, settings[key]])) as Pick<CoverSettings, K>
}

function prepareContext(canvas: HTMLCanvasElement, size: number): CanvasRenderingContext2D | null {
  canvas.width = size
  canvas.height = size
  return canvas.getContext('2d')
}

/** Calques 2D de l'aperçu (grain, effets, texte), peints avec les mêmes fonctions que l'export. */
export function useCoverOverlays(canvases: OverlayCanvases, settings: Readonly<Ref<CoverSettings>>, pixelSize: Ref<number>) {
  const sources = <K extends keyof CoverSettings>(keys: readonly K[]) => keys.map((key) => () => settings.value[key])

  watch([canvases.grain, () => settings.value.grain, pixelSize], ([canvas, amount, size]) => {
    if (canvas && size > 0) paintGrain(canvas, size, amount)
  })

  watch([canvases.effects, pixelSize, ...sources(EFFECT_INPUT_KEYS)], ([canvas, size]) => {
    if (!canvas || size <= 0) return
    const context = prepareContext(canvas, size)
    if (context) paintEffects(context, pickKeys(settings.value, EFFECT_INPUT_KEYS), size)
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
