import type { DrawnStroke } from './drawing'
import type { FontId } from './fonts'
import { LOOKS, type LookId } from './looks'
import { createSeed } from './random'
import type { StrokeShapeId } from './shapes'

export type ShapeId = StrokeShapeId | 'liquid' | 'drawn'
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
  tint: string
  backgroundTop: string
  backgroundBottom: string
  bloom: number
  grain: number
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
  usesDensity: boolean
  keptAcrossLooks: boolean
}

export const SHAPES: Record<ShapeId, ShapeSpec> = {
  ribbons: { label: 'Rubans', usesDensity: true, keptAcrossLooks: false },
  zigzag: { label: 'Zigzag', usesDensity: true, keptAcrossLooks: false },
  tangle: { label: 'Nœuds', usesDensity: true, keptAcrossLooks: false },
  shards: { label: 'Éclats', usesDensity: true, keptAcrossLooks: false },
  liquid: { label: 'Liquide', usesDensity: true, keptAcrossLooks: false },
  drawn: { label: 'Dessin', usesDensity: false, keptAcrossLooks: true },
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
    tint: '#ffffff',
    backgroundTop: '#ffffff',
    backgroundBottom: '#ffffff',
    bloom: 0,
    grain: 0,
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
