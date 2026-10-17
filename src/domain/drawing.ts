import { frameHalfExtentAt } from './camera'
import { createRandom, randomBetween } from './random'
import type { FormParams, Stroke, StrokeProfile } from './shapes'
import type { Vec3 } from './vector'

/** Point dans le cadre, normalisé : (0, 0) en haut à gauche, (1, 1) en bas à droite. */
export type Point2 = readonly [number, number]

export interface Brush {
  size: number
  profile: StrokeProfile
}

export interface DrawnStroke extends Brush {
  points: readonly Point2[]
}

export type DrawingMode = 'draw' | 'orbit'

export const DRAWING_MODES: Record<DrawingMode, { label: string }> = {
  draw: { label: 'Dessiner' },
  orbit: { label: 'Pivoter' },
}

export const BRUSH_PROFILES: Record<StrokeProfile, { label: string }> = {
  round: { label: 'Tube' },
  spike: { label: 'Épine' },
}

export const DEFAULT_BRUSH: Brush = { size: 1, profile: 'round' }
export const MIN_POINT_SPACING = 0.012

const BASE_RADIUS = 0.18
const CLOSE_TOLERANCE = 0.04
const LAYER_DEPTHS = [0, 0.3, -0.3, 0.6, -0.6]
const WOBBLE_DEPTH = 1
const WOBBLE_FREQUENCY = 8

function distance(a: Point2, b: Point2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function cumulativeLengths(points: readonly Point2[]): number[] {
  const lengths = [0]
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]))
  return lengths
}

function pathLength(points: readonly Point2[]): number {
  return cumulativeLengths(points)[points.length - 1] ?? 0
}

/** Retire les points trop rapprochés d'un tracé à main levée, en gardant toujours le premier et le dernier. */
export function simplifyPath(points: readonly Point2[], minSpacing = MIN_POINT_SPACING): Point2[] {
  if (points.length < 2) return [...points]
  const kept: Point2[] = [points[0]]
  for (const point of points.slice(1, -1)) {
    if (distance(point, kept[kept.length - 1]) >= minSpacing) kept.push(point)
  }
  const last = points[points.length - 1]
  if (kept.length > 1 && distance(last, kept[kept.length - 1]) < minSpacing) kept[kept.length - 1] = last
  else if (distance(last, kept[kept.length - 1]) > 0) kept.push(last)
  return kept
}

export function isDrawablePath(points: readonly Point2[]): boolean {
  return points.length >= 2 && pathLength(points) >= MIN_POINT_SPACING
}

/** Un tracé qui revient à son point de départ devient une boucle fermée. */
export function isClosedPath(points: readonly Point2[], tolerance = CLOSE_TOLERANCE): boolean {
  if (points.length < 4) return false
  return distance(points[0], points[points.length - 1]) <= tolerance && pathLength(points) > tolerance * 6
}

export function brushRadius(size: number, thickness: number): number {
  return BASE_RADIUS * size * thickness
}

/** Diamètre à l'écran du tube produit par le pinceau, pour un cadre de frameSizePx pixels. */
export function brushScreenDiameter(size: number, thickness: number, frameSizePx: number): number {
  return ((2 * brushRadius(size, thickness)) / (2 * frameHalfExtentAt(0))) * frameSizePx
}

/** Place un point du cadre en 3D, en compensant la perspective pour qu'il retombe exactement là où il a été dessiné. */
export function frameToWorld([u, v]: Point2, depth: number): Vec3 {
  const half = frameHalfExtentAt(depth)
  return [(u * 2 - 1) * half, (1 - v * 2) * half, depth]
}

/** Fréquence d'ondulation ; sur une boucle, arrondie à un nombre entier de périodes pour que la jonction soit continue. */
function wobbleFrequency(closed: boolean, loopLength: number): number {
  if (!closed || loopLength <= 0) return WOBBLE_FREQUENCY
  const cycles = Math.max(1, Math.round((loopLength * WOBBLE_FREQUENCY) / (Math.PI * 2)))
  return (cycles * Math.PI * 2) / loopLength
}

export function drawnStrokesToStrokes(
  drawn: readonly DrawnStroke[],
  { seed, thickness, chaos }: Pick<FormParams, 'seed' | 'thickness' | 'chaos'>,
): Stroke[] {
  return drawn.map((stroke, index) => {
    const phase = randomBetween(createRandom(seed + index), 0, Math.PI * 2)
    const layer = LAYER_DEPTHS[index % LAYER_DEPTHS.length]
    const closed = isClosedPath(stroke.points)
    const points = closed ? stroke.points.slice(0, -1) : stroke.points
    const lengths = cumulativeLengths(points)
    const loopLength = lengths[lengths.length - 1] + distance(points[points.length - 1], points[0])
    const frequency = wobbleFrequency(closed, loopLength)
    return {
      points: points.map((point, i) =>
        frameToWorld(point, layer + chaos * WOBBLE_DEPTH * Math.sin(phase + lengths[i] * frequency)),
      ),
      closed,
      radius: brushRadius(stroke.size, thickness),
      profile: stroke.profile,
    }
  })
}
