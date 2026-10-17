import { describe, expect, it } from 'vitest'
import { fitFontSize, layoutCoverText } from './textLayout'

const SIZE = 1000
const base = { title: 'Chrome', subtitle: 'Y2K Elements', textPosition: 'center' as const, textScale: 1 }

describe('layoutCoverText', () => {
  it('met le sous-titre en capitales sous le titre', () => {
    const [title, subtitle] = layoutCoverText(base, SIZE).lines
    expect(title.role).toBe('title')
    expect(subtitle.text).toBe('Y2K ELEMENTS')
    expect(subtitle.centerY).toBeGreaterThan(title.centerY)
  })

  it('centre le bloc verticalement', () => {
    const { lines } = layoutCoverText(base, SIZE)
    const top = lines[0].centerY - lines[0].fontSize / 2
    const last = lines[lines.length - 1]
    const bottom = last.centerY + last.fontSize / 2
    expect((top + bottom) / 2).toBeCloseTo(SIZE / 2)
  })

  it('reste dans les marges en haut et en bas', () => {
    const top = layoutCoverText({ ...base, textPosition: 'top' }, SIZE).lines[0]
    expect(top.centerY - top.fontSize / 2).toBeCloseTo(SIZE * 0.08)
    const bottomLines = layoutCoverText({ ...base, textPosition: 'bottom' }, SIZE).lines
    const last = bottomLines[bottomLines.length - 1]
    expect(last.centerY + last.fontSize / 2).toBeCloseTo(SIZE * 0.92)
  })

  it('ignore les lignes vides', () => {
    expect(layoutCoverText({ ...base, title: '   ' }, SIZE).lines.map((line) => line.role)).toEqual(['subtitle'])
    expect(layoutCoverText({ ...base, title: '', subtitle: '' }, SIZE).lines).toEqual([])
  })

  it("suit l'échelle demandée", () => {
    const normal = layoutCoverText(base, SIZE).lines[0].fontSize
    const large = layoutCoverText({ ...base, textScale: 2 }, SIZE).lines[0].fontSize
    expect(large).toBeCloseTo(normal * 2)
  })
})

describe('fitFontSize', () => {
  it('garde la taille si le texte tient', () => {
    expect(fitFontSize(100, 500, 800)).toBe(100)
  })

  it('réduit la taille proportionnellement si le texte déborde', () => {
    expect(fitFontSize(100, 1600, 800)).toBe(50)
  })
})
