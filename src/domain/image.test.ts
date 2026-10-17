import { describe, expect, it } from 'vitest'
import { frameHalfExtentAt } from './camera'
import { applyLook, createCoverSettings } from './cover'
import { createImageLayer, fitWithin, imagePlacement, usesLuminanceMask, type ImageAsset } from './imageLayer'
import { boxBlur, buildImageRelief, extractMask, hasTransparency, squaredDistanceToOutside } from './imageRelief'
import { describeForm } from './sceneForm'

type Pixel = readonly [number, number, number, number]

function asset(width: number, height: number, pixelAt: (x: number, y: number) => Pixel): ImageAsset {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set(pixelAt(x, y), (y * width + x) * 4)
  }
  return { name: 'test.png', width, height, data, hasAlpha: hasTransparency(data), previewUrl: '' }
}

const BLACK: Pixel = [0, 0, 0, 255]
const WHITE: Pixel = [255, 255, 255, 255]
const CLEAR: Pixel = [0, 0, 0, 0]

const insideSquare = (size: number, margin: number) => (x: number, y: number) =>
  x >= margin && y >= margin && x < size - margin && y < size - margin

const darkSquare = asset(21, 21, (x, y) => (insideSquare(21, 5)(x, y) ? BLACK : WHITE))
const transparentSquare = asset(21, 21, (x, y) => (insideSquare(21, 5)(x, y) ? WHITE : CLEAR))
const OPTIONS = { treatment: 'inflate' as const, keep: 'dark' as const, threshold: 0.5 }

describe('hasTransparency', () => {
  it('distingue une image opaque d’une image détourée', () => {
    expect(darkSquare.hasAlpha).toBe(false)
    expect(transparentSquare.hasAlpha).toBe(true)
  })
})

describe('extractMask', () => {
  it('utilise l’alpha quand l’image en a', () => {
    const mask = extractMask(transparentSquare, OPTIONS)
    expect(mask[10 * 21 + 10]).toBe(1)
    expect(mask[0]).toBe(0)
  })

  it('garde la partie sombre ou claire d’une image opaque selon le réglage', () => {
    const dark = extractMask(darkSquare, OPTIONS)
    expect(dark[10 * 21 + 10]).toBe(1)
    expect(dark[0]).toBe(0)
    const light = extractMask(darkSquare, { ...OPTIONS, keep: 'light' })
    expect(light[10 * 21 + 10]).toBe(0)
    expect(light[0]).toBe(1)
  })

  it('suit le seuil de luminosité', () => {
    const gray = asset(2, 1, () => [128, 128, 128, 255])
    expect(extractMask(gray, { ...OPTIONS, threshold: 0.8 })[0]).toBe(1)
    expect(extractMask(gray, { ...OPTIONS, threshold: 0.2 })[0]).toBe(0)
  })

  it('garde toute une image opaque en relief', () => {
    expect(extractMask(darkSquare, { ...OPTIONS, treatment: 'relief' }).every((value) => value === 1)).toBe(true)
  })
})

describe('squaredDistanceToOutside', () => {
  it('vaut 0 dehors et compte le pourtour de l’image comme extérieur', () => {
    const inside = Array.from({ length: 25 }, () => true)
    const distances = squaredDistanceToOutside(inside, 5, 5)
    expect(distances[2 * 5 + 2]).toBe(9)
    expect(distances[0]).toBe(1)
  })

  it('mesure la distance euclidienne, pas une distance de damier', () => {
    const inside = Array.from({ length: 49 }, (_, i) => i !== 0)
    const distances = squaredDistanceToOutside(inside, 7, 7)
    expect(distances[0]).toBe(0)
    expect(distances[3 * 7 + 3]).toBe(4 * 4)
  })
})

describe('boxBlur', () => {
  it('conserve un champ uniforme', () => {
    const field = new Float32Array(16).fill(0.5)
    expect(Array.from(boxBlur(field, 4, 4, 1))).toEqual(Array.from(field))
  })
})

describe('buildImageRelief', () => {
  it('gonfle la forme : nulle dehors, plus haute au centre qu’au bord', () => {
    const { heights } = buildImageRelief(transparentSquare, OPTIONS)
    expect(heights[0]).toBe(0)
    expect(heights[10 * 21 + 10]).toBeGreaterThan(heights[10 * 21 + 5])
    expect(heights[10 * 21 + 5]).toBeGreaterThan(0)
  })

  it('est symétrique pour une forme symétrique', () => {
    const { heights } = buildImageRelief(transparentSquare, OPTIONS)
    expect(heights[10 * 21 + 6]).toBeCloseTo(heights[10 * 21 + 14])
  })

  it('élève les zones claires en relief', () => {
    const { heights } = buildImageRelief(darkSquare, { ...OPTIONS, treatment: 'relief' })
    expect(heights[0]).toBeGreaterThan(heights[10 * 21 + 10])
  })
})

describe('usesLuminanceMask', () => {
  it('ne demande un seuil que pour une image opaque gonflée', () => {
    expect(usesLuminanceMask({ asset: darkSquare, treatment: 'inflate' })).toBe(true)
    expect(usesLuminanceMask({ asset: darkSquare, treatment: 'relief' })).toBe(false)
    expect(usesLuminanceMask({ asset: transparentSquare, treatment: 'inflate' })).toBe(false)
  })
})

describe('fitWithin', () => {
  it('réduit en gardant les proportions', () => {
    expect(fitWithin(1000, 500, 384)).toEqual({ width: 384, height: 192 })
  })

  it('n’agrandit pas une petite image', () => {
    expect(fitWithin(100, 50, 384)).toEqual({ width: 100, height: 50 })
  })

  it('donne une taille par défaut à une image sans dimensions (SVG)', () => {
    expect(fitWithin(0, 0, 384)).toEqual({ width: 384, height: 384 })
  })
})

describe('imagePlacement', () => {
  const layer = createImageLayer(transparentSquare)

  it('centre l’image et occupe la part demandée du cadre', () => {
    const { position, width } = imagePlacement({ ...layer, scale: 0.5 })
    expect(position[0]).toBeCloseTo(0)
    expect(position[1]).toBeCloseTo(0)
    expect(width / (2 * frameHalfExtentAt(position[2]))).toBeCloseTo(0.5)
  })

  it('décale vers la droite et vers le bas', () => {
    const { position } = imagePlacement({ ...layer, offsetX: 0.25, offsetY: 0.25 })
    expect(position[0]).toBeGreaterThan(0)
    expect(position[1]).toBeLessThan(0)
  })

  it('aplatit le relief à profondeur nulle', () => {
    expect(imagePlacement({ ...layer, depth: 0 }).reliefDepth).toBe(0)
  })
})

describe('image dans la cover', () => {
  it('reste en place quand on change d’ambiance, avec le motif Aucun', () => {
    const settings = { ...createCoverSettings('chrome', 1), shapeId: 'none' as const, image: createImageLayer(darkSquare) }
    const result = applyLook(settings, 'nocturne')
    expect(result.shapeId).toBe('none')
    expect(result.image?.asset).toBe(darkSquare)
  })

  it('le motif Aucun ne produit aucune forme', () => {
    const form = describeForm({ ...createCoverSettings('chrome', 1), shapeId: 'none' })
    expect(form).toEqual({ kind: 'strokes', strokes: [] })
  })
})
