import { BACKGROUND_STYLES, type BackgroundStyleId } from './backgrounds'
import { applyLook, shapeUses, type CoverSettings, type ShapeId } from './cover'
import { LOOKS, type LookId } from './looks'
import { createSeed, randomBetween, randomInt, type Random } from './random'
import { clampToRange, RANGES, type NumericRange } from './ranges'
import { SURFACE_TEXTURES, type SurfaceTextureId } from './surfaceTextures'
import type { SymmetryId } from './symmetry'

const GENERATED_SHAPES: readonly ShapeId[] = ['ribbons', 'zigzag', 'tangle', 'shards', 'liquid']
const USER_SHAPES: readonly ShapeId[] = ['drawn', 'none']
const SYMMETRIC_CHOICES: readonly SymmetryId[] = ['mirror', 'quad', 'kaleido']

const CHANCES = {
  texture: 0.55,
  newBackground: 0.6,
  symmetry: 0.4,
  aberration: 0.4,
  vignette: 0.5,
  sparkles: 0.5,
  scanlines: 0.2,
}

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

function keysOf<T extends string>(catalog: Record<T, unknown>): T[] {
  return Object.keys(catalog) as T[]
}

function maybe(random: Random, chance: number, range: NumericRange, min: number, max: number): number {
  return random() < chance ? clampToRange(randomBetween(random, min, max), range) : 0
}

/**
 * Tire une combinaison au hasard : ambiance, motif, matière, fond, symétrie et effets.
 * Le texte, l'image importée et les dessins de l'utilisateur sont conservés.
 */
export function surpriseSettings(settings: CoverSettings, random: Random): CoverSettings {
  const lookId = pick<LookId>(random, keysOf(LOOKS))
  const base = applyLook(settings, lookId)
  const shapeId = USER_SHAPES.includes(settings.shapeId) ? settings.shapeId : pick(random, GENERATED_SHAPES)
  const textures = keysOf(SURFACE_TEXTURES).filter((id) => id !== 'smooth')
  const surfaceTexture: SurfaceTextureId = random() < CHANCES.texture ? pick(random, textures) : 'smooth'
  const backgroundStyle: BackgroundStyleId =
    random() < CHANCES.newBackground ? pick(random, keysOf(BACKGROUND_STYLES)) : base.backgroundStyle
  const symmetry: SymmetryId =
    shapeUses(shapeId, 'symmetry') && random() < CHANCES.symmetry ? pick(random, SYMMETRIC_CHOICES) : 'none'

  return {
    ...base,
    shapeId,
    seed: createSeed(random),
    density: randomInt(random, 2, 6),
    thickness: clampToRange(randomBetween(random, 0.6, 1.6), RANGES.thickness),
    chaos: clampToRange(randomBetween(random, 0.2, 0.9), RANGES.chaos),
    symmetry,
    surfaceTexture,
    textureStrength: clampToRange(randomBetween(random, 0.4, 1.1), RANGES.textureStrength),
    textureScale: clampToRange(randomBetween(random, 0.6, 2), RANGES.textureScale),
    backgroundStyle,
    aberration: maybe(random, CHANCES.aberration, RANGES.aberration, 0.15, 0.6),
    vignette: maybe(random, CHANCES.vignette, RANGES.vignette, 0.2, 0.7),
    sparkles: maybe(random, CHANCES.sparkles, RANGES.sparkles, 0.2, 0.7),
    scanlines: maybe(random, CHANCES.scanlines, RANGES.scanlines, 0.15, 0.5),
  }
}
