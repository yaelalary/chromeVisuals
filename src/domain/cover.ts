import type { BackgroundStyleId } from './backgrounds'
import type { DrawnStroke } from './drawing'
import type { FontId } from './fonts'
import type { ImageLayer } from './imageLayer'
import { LOOKS, type LookId } from './looks'
import { createSeed } from './random'
import type { StrokeShapeId } from './shapes'
import type { SurfaceTextureId } from './surfaceTextures'
import type { SymmetryId } from './symmetry'

export type ShapeId = StrokeShapeId | 'liquid' | 'drawn' | 'none'
export type FormControl = 'density' | 'thickness' | 'chaos' | 'symmetry'
export type TextPosition = 'top' | 'center' | 'bottom'
export type TextStyle = 'plain' | 'chrome'

export interface CoverSettings {
  lookId: LookId
  shapeId: ShapeId
  seed: number
  density: number
  thickness: number
  chaos: number
  drawnStrokes: readonly DrawnStroke[]
  image: ImageLayer | null
  symmetry: SymmetryId
  tint: string
  surfaceTexture: SurfaceTextureId
  textureStrength: number
  textureScale: number
  backgroundStyle: BackgroundStyleId
  backgroundTop: string
  backgroundBottom: string
  bloom: number
  grain: number
  aberration: number
  vignette: number
  sparkles: number
  scanlines: number
  title: string
  subtitle: string
  fontId: FontId
  textStyle: TextStyle
  textColor: string
  textPosition: TextPosition
  textScale: number
}

export interface ShapeSpec {
  label: string
  controls: readonly FormControl[]
  keptAcrossLooks: boolean
}

const STROKE_CONTROLS: readonly FormControl[] = ['density', 'thickness', 'chaos', 'symmetry']

export const SHAPES: Record<ShapeId, ShapeSpec> = {
  ribbons: { label: 'Rubans', controls: STROKE_CONTROLS, keptAcrossLooks: false },
  zigzag: { label: 'Zigzag', controls: STROKE_CONTROLS, keptAcrossLooks: false },
  tangle: { label: 'Nœuds', controls: STROKE_CONTROLS, keptAcrossLooks: false },
  shards: { label: 'Éclats', controls: STROKE_CONTROLS, keptAcrossLooks: false },
  liquid: { label: 'Liquide', controls: ['density', 'thickness', 'chaos'], keptAcrossLooks: false },
  drawn: { label: 'Dessin', controls: ['thickness', 'chaos', 'symmetry'], keptAcrossLooks: true },
  none: { label: 'Aucun', controls: [], keptAcrossLooks: true },
}

export function shapeUses(shapeId: ShapeId, control: FormControl): boolean {
  return SHAPES[shapeId].controls.includes(control)
}

/** La symétrie choisie ne s'applique qu'aux motifs faits de traits. */
export function effectiveSymmetry(settings: Pick<CoverSettings, 'shapeId' | 'symmetry'>): SymmetryId {
  return shapeUses(settings.shapeId, 'symmetry') ? settings.symmetry : 'none'
}

export const TEXT_POSITIONS: Record<TextPosition, { label: string }> = {
  top: { label: 'Haut' },
  center: { label: 'Centre' },
  bottom: { label: 'Bas' },
}

export const TEXT_STYLES: Record<TextStyle, { label: string }> = {
  plain: { label: 'Uni' },
  chrome: { label: 'Chrome' },
}

export const EXPORT_SIZES = [1500, 3000] as const
export type ExportSize = (typeof EXPORT_SIZES)[number]

export function applyLook(settings: CoverSettings, lookId: LookId): CoverSettings {
  const defaults = LOOKS[lookId].defaults
  const shapeId = SHAPES[settings.shapeId].keptAcrossLooks ? settings.shapeId : defaults.shapeId
  return { ...settings, ...defaults, shapeId, lookId }
}

export function createCoverSettings(lookId: LookId = 'chrome', seed = createSeed()): CoverSettings {
  const base: CoverSettings = {
    lookId,
    shapeId: 'ribbons',
    seed,
    density: 4,
    thickness: 1,
    chaos: 0.5,
    drawnStrokes: [],
    image: null,
    symmetry: 'none',
    tint: '#ffffff',
    surfaceTexture: 'smooth',
    textureStrength: 0.6,
    textureScale: 1,
    backgroundStyle: 'gradient',
    backgroundTop: '#ffffff',
    backgroundBottom: '#ffffff',
    bloom: 0,
    grain: 0,
    aberration: 0,
    vignette: 0,
    sparkles: 0,
    scanlines: 0,
    title: 'Chrome',
    subtitle: 'Y2K Elements',
    fontId: 'didone',
    textStyle: 'plain',
    textColor: '#000000',
    textPosition: 'center',
    textScale: 1,
  }
  return applyLook(base, lookId)
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function coverFileName(settings: Pick<CoverSettings, 'title' | 'seed'>, size: number): string {
  const name = slugify(settings.title) || 'cover'
  return `${name}-${settings.seed}-${size}px.png`
}
