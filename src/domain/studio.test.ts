import { describe, expect, it } from 'vitest'
import { BACKGROUND_STYLES } from './backgrounds'
import { createCoverSettings, effectiveSymmetry } from './cover'
import { scanlineHeight, sparkleLayout } from './effects'
import { createImageLayer } from './imageLayer'
import { LOOKS } from './looks'
import { createRandom } from './random'
import { RANGES } from './ranges'
import { surpriseSettings } from './surprise'
import {
  blurWrapped,
  heightToNormalMap,
  normalize01,
  seamlessRepeat,
  SURFACE_TEXTURES,
  textureHeights,
  TUBE_AROUND_REPEATS,
  type SurfaceTextureId,
} from './surfaceTextures'
import { applySymmetry, SYMMETRIES } from './symmetry'

const SIZE = 64
const TEXTURED: SurfaceTextureId[] = (Object.keys(SURFACE_TEXTURES) as SurfaceTextureId[]).filter((id) => id !== 'smooth')

describe('textures de surface', () => {
  it('la surface lisse n’a pas de relief', () => {
    expect(textureHeights('smooth', SIZE)).toBeNull()
  })

  it.each(TEXTURED)('%s produit un champ normalisé dans [0, 1]', (id) => {
    const heights = textureHeights(id, SIZE)
    expect(heights).not.toBeNull()
    expect(Math.min(...heights!)).toBeCloseTo(0)
    expect(Math.max(...heights!)).toBeCloseTo(1)
  })

  it.each(TEXTURED)('%s est déterministe', (id) => {
    expect(textureHeights(id, SIZE)).toEqual(textureHeights(id, SIZE))
  })

  it.each(['ripples', 'hammered'] as const)('%s se raccorde bord à bord', (id) => {
    const heights = textureHeights(id, SIZE)!
    const edgeJumps = Array.from({ length: SIZE }, (_, y) => Math.abs(heights[y * SIZE] - heights[y * SIZE + SIZE - 1]))
    const innerJumps = Array.from({ length: SIZE }, (_, y) => Math.abs(heights[y * SIZE + 1] - heights[y * SIZE]))
    expect(Math.max(...edgeJumps)).toBeLessThanOrEqual(Math.max(...innerJumps) * 2 + 1e-6)
  })

  it('le brossé ne varie que dans une direction', () => {
    const heights = textureHeights('brushed', SIZE)!
    const row = heights.slice(10 * SIZE, 11 * SIZE)
    expect(Math.max(...row) - Math.min(...row)).toBeLessThan(1e-6)
  })
})

describe('seamlessRepeat', () => {
  it('fait toujours tenir un nombre entier de motifs autour d’un tube', () => {
    for (let scale = 0.3; scale <= 4; scale += 0.05) {
      const [, around] = seamlessRepeat(scale)
      const turns = around * TUBE_AROUND_REPEATS
      expect(turns).toBeCloseTo(Math.round(turns))
      expect(turns).toBeGreaterThanOrEqual(1)
    }
  })

  it('suit exactement l’échelle dans la longueur', () => {
    expect(seamlessRepeat(1.37)[0]).toBe(1.37)
  })
})

describe('normalize01', () => {
  it('étale les valeurs sur [0, 1] et gère un champ plat', () => {
    expect(Array.from(normalize01(Float32Array.from([2, 4, 6])))).toEqual([0, 0.5, 1])
    expect(Array.from(normalize01(Float32Array.from([3, 3])))).toEqual([0, 0])
  })
})

describe('blurWrapped', () => {
  it('fait boucler le flou sur les bords', () => {
    const field = new Float32Array(16)
    field[0] = 9
    const blurred = blurWrapped(field, 4, 1)
    expect(blurred[3]).toBeCloseTo(1)
    expect(blurred[15]).toBeCloseTo(1)
  })
})

describe('heightToNormalMap', () => {
  it('donne une normale verticale sur une surface plate', () => {
    const pixels = heightToNormalMap(new Float32Array(16).fill(0.5), 4)
    expect(Array.from(pixels.slice(0, 4))).toEqual([128, 128, 255, 255])
  })

  it('incline la normale contre la pente', () => {
    const size = 8
    const ramp = Float32Array.from({ length: size * size }, (_, i) => Math.sin(((i % size) / size) * Math.PI * 2))
    const pixels = heightToNormalMap(ramp, size)
    expect(pixels[0]).toBeLessThan(128)
    expect(pixels[(size / 2) * 4]).toBeGreaterThan(128)
  })
})

describe('symétries', () => {
  it('chaque symétrie commence par l’original', () => {
    for (const { transforms } of Object.values(SYMMETRIES)) {
      expect(transforms[0]).toEqual({ mirrorX: false, mirrorY: false, rotation: 0 })
    }
  })

  it('le miroir renvoie le point de l’autre côté', () => {
    const [, mirrored] = SYMMETRIES.mirror.transforms
    expect(applySymmetry([2, 1], mirrored)).toEqual([-2, 1])
  })

  it('les quadrants couvrent les quatre coins', () => {
    const points = SYMMETRIES.quad.transforms.map((t) => applySymmetry([1, 1], t).map(Math.sign).join(','))
    expect(new Set(points)).toEqual(new Set(['1,1', '-1,1', '1,-1', '-1,-1']))
  })

  it('le kaléidoscope répartit six copies à égale distance du centre', () => {
    const copies = SYMMETRIES.kaleido.transforms.map((t) => applySymmetry([2, 0.5], t))
    expect(copies).toHaveLength(6)
    for (const [x, y] of copies) expect(Math.hypot(x, y)).toBeCloseTo(Math.hypot(2, 0.5))
  })

  it('ne s’applique qu’aux motifs faits de traits', () => {
    expect(effectiveSymmetry({ shapeId: 'ribbons', symmetry: 'quad' })).toBe('quad')
    expect(effectiveSymmetry({ shapeId: 'drawn', symmetry: 'mirror' })).toBe('mirror')
    expect(effectiveSymmetry({ shapeId: 'liquid', symmetry: 'quad' })).toBe('none')
    expect(effectiveSymmetry({ shapeId: 'none', symmetry: 'kaleido' })).toBe('none')
  })
})

describe('effets', () => {
  it('aucun scintillement à zéro, davantage quand on monte', () => {
    expect(sparkleLayout(1, 0)).toEqual([])
    expect(sparkleLayout(1, 1).length).toBeGreaterThan(sparkleLayout(1, 0.3).length)
  })

  it('place les scintillements dans le cadre, de façon reproductible', () => {
    const sparkles = sparkleLayout(42, 1)
    expect(sparkleLayout(42, 1)).toEqual(sparkles)
    for (const { x, y } of sparkles) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(1)
    }
  })

  it('les lignes de balayage grandissent avec l’image', () => {
    expect(scanlineHeight(3000) / scanlineHeight(1500)).toBeCloseTo(2)
    expect(scanlineHeight(100)).toBe(1)
  })
})

describe('surpriseSettings', () => {
  const base = { ...createCoverSettings('chrome', 1), title: 'Mon titre', subtitle: 'Moi' }

  it('garde le texte et l’image', () => {
    const image = createImageLayer({ name: 'a', width: 1, height: 1, data: new Uint8ClampedArray(4), hasAlpha: false, previewUrl: '' })
    for (let seed = 0; seed < 20; seed++) {
      const result = surpriseSettings({ ...base, image }, createRandom(seed))
      expect(result.title).toBe('Mon titre')
      expect(result.subtitle).toBe('Moi')
      expect(result.image).toBe(image)
    }
  })

  it('respecte les dessins de l’utilisateur', () => {
    const drawn = { ...base, shapeId: 'drawn' as const }
    expect(surpriseSettings(drawn, createRandom(3)).shapeId).toBe('drawn')
  })

  it('reste dans les catalogues et les bornes des réglages', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = surpriseSettings(base, createRandom(seed))
      expect(Object.keys(LOOKS)).toContain(result.lookId)
      expect(Object.keys(SURFACE_TEXTURES)).toContain(result.surfaceTexture)
      expect(Object.keys(BACKGROUND_STYLES)).toContain(result.backgroundStyle)
      for (const key of ['density', 'thickness', 'chaos', 'textureStrength', 'textureScale', 'aberration', 'vignette', 'sparkles', 'scanlines'] as const) {
        expect(result[key]).toBeGreaterThanOrEqual(RANGES[key].min)
        expect(result[key]).toBeLessThanOrEqual(RANGES[key].max)
      }
      expect(effectiveSymmetry(result)).toBe(result.symmetry)
    }
  })

  it('varie d’un tirage à l’autre', () => {
    const looks = new Set(Array.from({ length: 30 }, (_, seed) => surpriseSettings(base, createRandom(seed)).lookId))
    expect(looks.size).toBeGreaterThan(1)
  })
})
