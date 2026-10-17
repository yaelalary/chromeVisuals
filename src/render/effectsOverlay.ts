import type { CoverSettings } from '../domain/cover'
import { scanlineHeight, sparkleLayout } from '../domain/effects'
import { drawSparkle } from './sparkle'

export const EFFECT_INPUT_KEYS = ['seed', 'sparkles', 'scanlines'] as const satisfies ReadonlyArray<keyof CoverSettings>
export type EffectInput = Pick<CoverSettings, (typeof EFFECT_INPUT_KEYS)[number]>

const SCANLINE_MAX_ALPHA = 0.35

function paintScanlines(context: CanvasRenderingContext2D, size: number, amount: number): void {
  if (amount <= 0) return
  const height = scanlineHeight(size)
  context.fillStyle = `rgba(0, 0, 0, ${amount * SCANLINE_MAX_ALPHA})`
  for (let y = 0; y < size; y += height * 2) context.fillRect(0, y, size, height)
}

function paintSparkles(context: CanvasRenderingContext2D, size: number, seed: number, amount: number): void {
  for (const sparkle of sparkleLayout(seed, amount)) {
    drawSparkle(context, sparkle.x * size, sparkle.y * size, sparkle.size * size, sparkle.rotation)
  }
}

/** Calque 2D posé sur la scène : lignes de balayage puis scintillements. */
export function paintEffects(context: CanvasRenderingContext2D, input: EffectInput, size: number): void {
  context.clearRect(0, 0, size, size)
  paintScanlines(context, size, input.scanlines)
  paintSparkles(context, size, input.seed, input.sparkles)
}
