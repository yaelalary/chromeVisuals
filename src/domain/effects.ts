import { createRandom, randomBetween } from './random'

export interface Sparkle {
  x: number
  y: number
  size: number
  rotation: number
}

const MAX_SPARKLES = 24
const SPARKLE_SALT = 0x5eed
const BIG_SPARKLE_CHANCE = 0.15
const SCANLINE_REFERENCE = 320

/** Scintillements placés de façon reproductible ; coordonnées et tailles relatives au cadre. */
export function sparkleLayout(seed: number, amount: number): Sparkle[] {
  const random = createRandom(seed ^ SPARKLE_SALT)
  const count = Math.round(Math.max(0, Math.min(1, amount)) * MAX_SPARKLES)
  return Array.from({ length: count }, () => {
    const big = random() < BIG_SPARKLE_CHANCE
    return {
      x: randomBetween(random, 0.04, 0.96),
      y: randomBetween(random, 0.04, 0.96),
      size: big ? randomBetween(random, 0.05, 0.09) : randomBetween(random, 0.012, 0.035),
      rotation: randomBetween(random, -0.2, 0.2),
    }
  })
}

/** Hauteur d'une ligne de balayage en pixels : proportionnelle à l'image pour que l'export ressemble à l'aperçu. */
export function scanlineHeight(size: number): number {
  return Math.max(1, size / SCANLINE_REFERENCE)
}
