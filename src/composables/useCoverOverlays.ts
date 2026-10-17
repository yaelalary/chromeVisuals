import { watch, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import { paintCoverText, TEXT_INPUT_KEYS, type CoverTextInput } from '../render/coverText'
import { paintGrain } from '../render/grain'
import { ensureFontLoaded } from '../services/fontService'

function pickTextInput(settings: CoverSettings): CoverTextInput {
  return Object.fromEntries(TEXT_INPUT_KEYS.map((key) => [key, settings[key]])) as CoverTextInput
}

/** Calques 2D de l'aperçu (grain et texte), peints avec les mêmes fonctions que l'export. */
export function useCoverOverlays(
  grainCanvas: Ref<HTMLCanvasElement | undefined>,
  textCanvas: Ref<HTMLCanvasElement | undefined>,
  settings: Readonly<Ref<CoverSettings>>,
  pixelSize: Ref<number>,
) {
  watch([grainCanvas, () => settings.value.grain, pixelSize], ([canvas, amount, size]) => {
    if (canvas && size > 0) paintGrain(canvas, size, amount)
  })

  let paintRequest = 0
  const textSources = TEXT_INPUT_KEYS.map((key) => () => settings.value[key])

  watch([textCanvas, pixelSize, ...textSources], async ([canvas, size]) => {
    if (!canvas || size <= 0) return
    const input = pickTextInput(settings.value)
    const request = ++paintRequest
    await ensureFontLoaded(input.fontId, input.title + input.subtitle)
    if (request !== paintRequest) return
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (context) paintCoverText(context, input, size)
  })
}
