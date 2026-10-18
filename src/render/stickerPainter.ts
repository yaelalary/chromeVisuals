import { STICKERS, type StickerId, type StickerPart } from '../domain/stickerShapes'
import type { PlacedSticker, StickerFinish } from '../domain/stickers'
import { chromeGradient } from './chromeGradient'

const STICKER_BOX = 100
const CHROME_SHADOW = 'rgba(0, 0, 0, 0.35)'
const SHADOW_RATIO = 0.04

const pathCache = new Map<string, Path2D>()

function pathFor(d: string): Path2D {
  let path = pathCache.get(d)
  if (!path) {
    path = new Path2D(d)
    pathCache.set(d, path)
  }
  return path
}

type InkFactory = (context: CanvasRenderingContext2D, color: string) => string | CanvasGradient

const INKS: Record<StickerFinish, InkFactory> = {
  flat: (_context, color) => color,
  chrome: (context) => chromeGradient(context, 0, STICKER_BOX),
}

function paintPart(context: CanvasRenderingContext2D, part: StickerPart, ink: string | CanvasGradient): void {
  const path = pathFor(part.d)
  if (part.mode === 'fill') {
    context.fillStyle = ink
    context.fill(path)
    return
  }
  context.strokeStyle = ink
  context.lineWidth = part.width ?? 1
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.stroke(path)
}

/** Dessine un sticker dans un carré de `pixelSize` pixels centré sur (x, y). */
export function drawSticker(
  context: CanvasRenderingContext2D,
  stickerId: StickerId,
  x: number,
  y: number,
  pixelSize: number,
  options: Pick<PlacedSticker, 'rotation' | 'color' | 'finish' | 'opacity'>,
): void {
  context.save()
  context.translate(x, y)
  context.rotate((options.rotation * Math.PI) / 180)
  context.scale(pixelSize / STICKER_BOX, pixelSize / STICKER_BOX)
  context.translate(-STICKER_BOX / 2, -STICKER_BOX / 2)
  context.globalAlpha = options.opacity
  if (options.finish === 'chrome') {
    context.shadowColor = CHROME_SHADOW
    context.shadowBlur = pixelSize * SHADOW_RATIO
  }
  const ink = INKS[options.finish](context, options.color)
  for (const part of STICKERS[stickerId].parts) paintPart(context, part, ink)
  context.restore()
}

/**
 * Peint les stickers par-dessus ce que contient déjà le contexte, dans l'ordre de la liste (le dernier passe devant).
 * N'efface rien : à l'export, le contexte porte déjà la scène composée.
 */
export function paintStickers(context: CanvasRenderingContext2D, stickers: readonly PlacedSticker[], size: number): void {
  for (const sticker of stickers) {
    drawSticker(context, sticker.stickerId, sticker.x * size, sticker.y * size, sticker.size * size, sticker)
  }
}
