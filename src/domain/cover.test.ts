import { describe, expect, it } from 'vitest'
import { applyLook, coverFileName, createCoverSettings } from './cover'
import { LOOKS } from './looks'
import { clampToRange, RANGES } from './ranges'
import { describeForm } from './sceneForm'

describe('applyLook', () => {
  it("applique les réglages par défaut de l'ambiance en gardant le texte et la graine", () => {
    const settings = { ...createCoverSettings('chrome', 10), title: 'Mon titre' }
    const result = applyLook(settings, 'nocturne')
    expect(result).toMatchObject({ ...LOOKS.nocturne.defaults, lookId: 'nocturne', title: 'Mon titre', seed: 10 })
  })
})

describe('createCoverSettings', () => {
  it("démarre sur l'ambiance demandée", () => {
    expect(createCoverSettings('holo', 1).shapeId).toBe(LOOKS.holo.defaults.shapeId)
  })
})

describe('describeForm', () => {
  it('décrit une surface pour le motif liquide', () => {
    expect(describeForm({ ...createCoverSettings('chrome', 1), shapeId: 'liquid' }).kind).toBe('surface')
  })

  it('décrit des traits pour les autres motifs', () => {
    expect(describeForm({ ...createCoverSettings('chrome', 1), shapeId: 'zigzag' }).kind).toBe('strokes')
  })
})

describe('coverFileName', () => {
  it('normalise le titre en slug', () => {
    expect(coverFileName({ title: "  Été à l'Ouest !", seed: 12 }, 3000)).toBe('ete-a-l-ouest-12-3000px.png')
  })

  it('utilise un nom par défaut sans titre', () => {
    expect(coverFileName({ title: '', seed: 5 }, 1500)).toBe('cover-5-1500px.png')
  })
})

describe('clampToRange', () => {
  it('borne et arrondit au pas', () => {
    expect(clampToRange(12, RANGES.density)).toBe(8)
    expect(clampToRange(0.333, RANGES.chaos)).toBe(0.33)
    expect(clampToRange(-1, RANGES.thickness)).toBe(0.3)
  })
})
