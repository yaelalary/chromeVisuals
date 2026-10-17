import { clamp } from './vector'

export interface NumericRange {
  min: number
  max: number
  step: number
  decimals: number
}

export const RANGES = {
  density: { min: 1, max: 8, step: 1, decimals: 0 },
  thickness: { min: 0.3, max: 2, step: 0.05, decimals: 2 },
  chaos: { min: 0, max: 1, step: 0.01, decimals: 2 },
  bloom: { min: 0, max: 1.5, step: 0.01, decimals: 2 },
  grain: { min: 0, max: 0.5, step: 0.01, decimals: 2 },
  textScale: { min: 0.4, max: 2, step: 0.05, decimals: 2 },
  brushSize: { min: 0.3, max: 3, step: 0.05, decimals: 2 },
} as const satisfies Record<string, NumericRange>

export function clampToRange(value: number, range: NumericRange): number {
  const stepped = Math.round((value - range.min) / range.step) * range.step + range.min
  return Number(clamp(stepped, range.min, range.max).toFixed(range.decimals))
}
