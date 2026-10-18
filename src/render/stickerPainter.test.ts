import { beforeAll, describe, expect, it } from 'vitest'
import { createRandom } from '../domain/random'
import { STICKERS } from '../domain/stickerShapes'
import { placeSticker } from '../domain/stickers'
import { paintStickers } from './stickerPainter'

/** Contexte 2D factice qui enregistre les appels de méthodes, pour vérifier ce que le peintre fait. */
function recordingContext(): { context: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = []
  const gradient = { addColorStop: () => undefined }
  const context = new Proxy(
    {},
    {
      get: (_target, property) => {
        if (property === 'createLinearGradient') return () => gradient
        return (..._args: unknown[]) => calls.push(String(property))
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  return { context, calls }
}

beforeAll(() => {
  globalThis.Path2D ??= class {} as typeof Path2D
})

describe('paintStickers', () => {
  const stickers = [placeSticker('a', 'star', createRandom(1)), placeSticker('b', 'globe', createRandom(2))]

  it('n’efface jamais le contexte : à l’export, il contient déjà la scène', () => {
    const { context, calls } = recordingContext()
    paintStickers(context, stickers, 1000)
    expect(calls).not.toContain('clearRect')
  })

  it('dessine chaque partie de chaque sticker', () => {
    const { context, calls } = recordingContext()
    paintStickers(context, stickers, 1000)
    const drawn = calls.filter((call) => call === 'fill' || call === 'stroke').length
    expect(drawn).toBe(STICKERS.star.parts.length + STICKERS.globe.parts.length)
  })

  it('isole chaque sticker dans son propre état de dessin', () => {
    const { context, calls } = recordingContext()
    paintStickers(context, stickers, 1000)
    expect(calls.filter((call) => call === 'save')).toHaveLength(stickers.length)
    expect(calls.filter((call) => call === 'restore')).toHaveLength(stickers.length)
  })
})
