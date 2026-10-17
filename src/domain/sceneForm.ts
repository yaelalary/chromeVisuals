import type { CoverSettings, ShapeId } from './cover'
import { drawnStrokesToStrokes } from './drawing'
import { generateStrokes, type FormParams, type Stroke, type StrokeShapeId } from './shapes'

export type SceneForm = { kind: 'strokes'; strokes: Stroke[] } | { kind: 'surface'; params: FormParams }

type FormDescriber = (settings: CoverSettings) => SceneForm

export function formParamsOf(settings: Pick<CoverSettings, 'seed' | 'density' | 'thickness' | 'chaos'>): FormParams {
  return {
    seed: settings.seed,
    density: settings.density,
    thickness: settings.thickness,
    chaos: settings.chaos,
  }
}

const generated =
  (shapeId: StrokeShapeId): FormDescriber =>
  (settings) => ({ kind: 'strokes', strokes: generateStrokes(shapeId, formParamsOf(settings)) })

const FORM_DESCRIBERS: Record<ShapeId, FormDescriber> = {
  ribbons: generated('ribbons'),
  zigzag: generated('zigzag'),
  tangle: generated('tangle'),
  shards: generated('shards'),
  liquid: (settings) => ({ kind: 'surface', params: formParamsOf(settings) }),
  drawn: (settings) => ({
    kind: 'strokes',
    strokes: drawnStrokesToStrokes(settings.drawnStrokes, formParamsOf(settings)),
  }),
  none: () => ({ kind: 'strokes', strokes: [] }),
}

export function describeForm(settings: CoverSettings): SceneForm {
  return FORM_DESCRIBERS[settings.shapeId](settings)
}
