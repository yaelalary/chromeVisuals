import { describe, expect, it } from 'vitest'
import { generateStrokes, strokeRadiusAt, type FormParams, type StrokeShapeId } from './shapes'

const PARAMS: FormParams = { seed: 1234, density: 4, thickness: 1, chaos: 0.5 }
const SHAPE_IDS: StrokeShapeId[] = ['ribbons', 'zigzag', 'tangle', 'shards']

describe('generateStrokes', () => {
  it.each(SHAPE_IDS)('%s est déterministe pour une graine donnée', (shapeId) => {
    expect(generateStrokes(shapeId, PARAMS)).toEqual(generateStrokes(shapeId, PARAMS))
  })

  it.each(SHAPE_IDS)('%s change avec la graine', (shapeId) => {
    expect(generateStrokes(shapeId, PARAMS)).not.toEqual(generateStrokes(shapeId, { ...PARAMS, seed: 99 }))
  })

  it.each(SHAPE_IDS)('%s produit des points finis et un rayon positif', (shapeId) => {
    for (const stroke of generateStrokes(shapeId, PARAMS)) {
      expect(stroke.points.length).toBeGreaterThanOrEqual(4)
      expect(stroke.radius).toBeGreaterThan(0)
      expect(stroke.points.flat().every(Number.isFinite)).toBe(true)
    }
  })

  it('augmente le nombre de traits avec la densité', () => {
    const sparse = generateStrokes('shards', { ...PARAMS, density: 1 })
    const dense = generateStrokes('shards', { ...PARAMS, density: 8 })
    expect(dense.length).toBeGreaterThan(sparse.length)
  })

  it("fait varier le rayon proportionnellement à l'épaisseur", () => {
    const thin = generateStrokes('ribbons', { ...PARAMS, thickness: 0.5 })
    const thick = generateStrokes('ribbons', { ...PARAMS, thickness: 1 })
    expect(thick[0].radius).toBeCloseTo(thin[0].radius * 2)
  })

  it('ferme les boucles du motif nœuds', () => {
    expect(generateStrokes('tangle', PARAMS).every((stroke) => stroke.closed)).toBe(true)
  })
})

describe('strokeRadiusAt', () => {
  const round = { profile: 'round' as const, closed: false }
  const spike = { profile: 'spike' as const, closed: false }

  it("arrondit les extrémités d'un tube ouvert", () => {
    expect(strokeRadiusAt(round, 0, 0.05)).toBe(0)
    expect(strokeRadiusAt(round, 0.025, 0.05)).toBeGreaterThan(0.5)
    expect(strokeRadiusAt(round, 0.5, 0.05)).toBe(1)
  })

  it("garde un rayon constant sur une boucle fermée", () => {
    expect(strokeRadiusAt({ profile: 'round', closed: true }, 0, 0.05)).toBe(1)
  })

  it('effile les éclats en pointe aux deux bouts', () => {
    expect(strokeRadiusAt(spike, 0, 0)).toBeCloseTo(0)
    expect(strokeRadiusAt(spike, 1, 0)).toBeCloseTo(0)
    expect(strokeRadiusAt(spike, 0.5, 0)).toBeCloseTo(1)
  })

  it('borne t dans [0, 1]', () => {
    expect(strokeRadiusAt(spike, -1, 0)).toBeCloseTo(0)
    expect(strokeRadiusAt(round, 2, 0.05)).toBe(0)
  })
})
