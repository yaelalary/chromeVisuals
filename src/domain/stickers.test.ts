import { describe, expect, it } from 'vitest'
import { applyLook, createCoverSettings } from './cover'
import { createRandom } from './random'
import { surpriseSettings } from './surprise'
import { circlePath, ellipsePath, heartPath, sparklePath, starPath, STICKERS, type StickerId } from './stickerShapes'
import {
  bringStickerToFront,
  clampStickerPosition,
  duplicatePlacedSticker,
  placeSticker,
  removePlacedSticker,
  updatePlacedSticker,
  type PlacedSticker,
} from './stickers'

const STICKER_IDS = Object.keys(STICKERS) as StickerId[]

function numbersIn(d: string): number[] {
  return (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
}

const ARC_PARAMETERS = 7

/** Points réellement atteints par un tracé : pour un arc, seul le point d'arrivée compte. */
function pointsIn(d: string): number[] {
  return (d.match(/[MLQCAZ][^MLQCAZ]*/g) ?? []).flatMap((segment) => {
    const values = numbersIn(segment)
    if (!segment.startsWith('A')) return values
    return values.filter((_, index) => index % ARC_PARAMETERS >= ARC_PARAMETERS - 2)
  })
}

describe('catalogue de stickers', () => {
  it.each(STICKER_IDS)('%s a au moins un tracé, qui reste dans la boîte 100 × 100', (id) => {
    const { parts } = STICKERS[id]
    expect(parts.length).toBeGreaterThan(0)
    for (const part of parts) {
      expect(part.d.startsWith('M')).toBe(true)
      for (const value of pointsIn(part.d)) {
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(101)
      }
    }
  })

  it('a des noms uniques', () => {
    const labels = STICKER_IDS.map((id) => STICKERS[id].label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('générateurs de tracés', () => {
  it('une étoile alterne pointes et creux', () => {
    const coordinates = numbersIn(starPath(5, 40, 20))
    expect(coordinates).toHaveLength(5 * 2 * 2)
    const distances = Array.from({ length: 10 }, (_, i) =>
      Math.hypot(coordinates[i * 2] - 50, coordinates[i * 2 + 1] - 50),
    )
    distances.forEach((distance, i) => expect(distance).toBeCloseTo(i % 2 === 0 ? 40 : 20, 1))
  })

  it('un cercle et une ellipse se referment', () => {
    expect(circlePath(50, 50, 10).endsWith('Z')).toBe(true)
    expect(ellipsePath(50, 50, 20, 10, 30).endsWith('Z')).toBe(true)
  })

  it('l’ellipse tournée garde ses extrémités à la bonne distance du centre', () => {
    const [x, y] = numbersIn(ellipsePath(50, 50, 20, 10, 90))
    expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(20)
  })

  it('le scintillement touche ses quatre pointes', () => {
    const d = sparklePath(40, 5)
    expect(d).toContain('50 10')
    expect(d).toContain('90 50')
    expect(d).toContain('50 90')
    expect(d).toContain('10 50')
  })

  it('un cœur réduit reste centré et plus petit', () => {
    const full = numbersIn(heartPath(1))
    const small = numbersIn(heartPath(0.5))
    expect(Math.max(...small) - Math.min(...small)).toBeLessThan(Math.max(...full) - Math.min(...full))
  })
})

describe('stickers posés', () => {
  const sticker = (id: string, extra: Partial<PlacedSticker> = {}): PlacedSticker => ({
    ...placeSticker(id, 'star', createRandom(1)),
    ...extra,
  })

  it('pose un sticker près du centre, en chrome par défaut', () => {
    const placed = placeSticker('a', 'heart', createRandom(4))
    expect(placed.stickerId).toBe('heart')
    expect(placed.finish).toBe('chrome')
    expect(Math.abs(placed.x - 0.5)).toBeLessThanOrEqual(0.15)
    expect(Math.abs(placed.y - 0.5)).toBeLessThanOrEqual(0.15)
  })

  it('modifie uniquement le sticker visé', () => {
    const list = [sticker('a'), sticker('b')]
    const result = updatePlacedSticker(list, 'b', { size: 0.5 })
    expect(result[0]).toEqual(list[0])
    expect(result[1].size).toBe(0.5)
  })

  it('retire un sticker', () => {
    expect(removePlacedSticker([sticker('a'), sticker('b')], 'a').map((s) => s.id)).toEqual(['b'])
  })

  it('duplique à côté, au premier plan', () => {
    const result = duplicatePlacedSticker([sticker('a', { x: 0.5, y: 0.5 }), sticker('b')], 'a', 'c')
    expect(result.map((s) => s.id)).toEqual(['a', 'b', 'c'])
    expect(result[2].x).toBeCloseTo(0.54)
    expect(result[2].y).toBeCloseTo(0.54)
  })

  it('garde la copie dans le cadre', () => {
    const [, copy] = duplicatePlacedSticker([sticker('a', { x: 0.99, y: 0.99 })], 'a', 'b')
    expect(copy.x).toBe(1)
    expect(copy.y).toBe(1)
  })

  it('fait passer un sticker devant les autres', () => {
    const list = [sticker('a'), sticker('b'), sticker('c')]
    expect(bringStickerToFront(list, 'a').map((s) => s.id)).toEqual(['b', 'c', 'a'])
    expect(bringStickerToFront(list, 'inconnu')).toEqual(list)
  })

  it('borne les positions au cadre', () => {
    expect(clampStickerPosition(-0.3)).toBe(0)
    expect(clampStickerPosition(1.4)).toBe(1)
    expect(clampStickerPosition(0.3)).toBe(0.3)
  })

  it('survivent au changement d’ambiance et au bouton Surprise', () => {
    const settings = { ...createCoverSettings('chrome', 1), stickers: [sticker('a')] }
    expect(applyLook(settings, 'holo').stickers).toEqual(settings.stickers)
    expect(surpriseSettings(settings, createRandom(2)).stickers).toEqual(settings.stickers)
  })
})
