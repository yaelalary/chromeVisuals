import { describe, expect, it } from 'vitest'
import { createLiquidField } from './liquid'
import { createNoise2D } from './noise'
import { createRandom } from './random'

describe('createNoise2D', () => {
  it('reste dans [-1, 1]', () => {
    const noise = createNoise2D(createRandom(5))
    for (let x = -20; x < 20; x += 0.37) {
      for (let y = -20; y < 20; y += 0.41) {
        const value = noise(x, y)
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('est continu', () => {
    const noise = createNoise2D(createRandom(5))
    expect(Math.abs(noise(1.5, 2.5) - noise(1.501, 2.5))).toBeLessThan(0.02)
  })

  it('est déterministe pour une graine donnée', () => {
    expect(createNoise2D(createRandom(9))(3.3, 1.1)).toBe(createNoise2D(createRandom(9))(3.3, 1.1))
  })
})

describe('createLiquidField', () => {
  const params = { seed: 77, density: 4, thickness: 1, chaos: 0.5 }

  it('est déterministe et fini', () => {
    const height = createLiquidField(params)(1.2, -0.4)
    expect(Number.isFinite(height)).toBe(true)
    expect(createLiquidField(params)(1.2, -0.4)).toBe(height)
  })

  it("amplifie le relief avec l'épaisseur", () => {
    const sample = (thickness: number) => {
      const field = createLiquidField({ ...params, thickness })
      return Array.from({ length: 50 }, (_, i) => Math.abs(field(i * 0.3, i * 0.2))).reduce((a, b) => a + b)
    }
    expect(sample(2)).toBeGreaterThan(sample(0.3))
  })
})
