import type { BackgroundStyleId } from '../domain/backgrounds'
import { heightToNormalMap, textureHeights, type SurfaceTextureId } from '../domain/surfaceTextures'
import { paintBackground, type BackgroundColors } from './backgroundPainters'

export const THUMBNAIL_SIZE = 96

const LIGHT = normalize([-0.5, 0.6, 0.65])
const SHEEN_LOW = 70
const SHEEN_HIGH = 235

function normalize([x, y, z]: number[]): number[] {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

/** Aperçu d'une texture : un dégradé métallique éclairé par sa carte de normales. */
export function textureThumbnail(id: SurfaceTextureId): string {
  const canvas = document.createElement('canvas')
  canvas.width = THUMBNAIL_SIZE
  canvas.height = THUMBNAIL_SIZE
  const context = canvas.getContext('2d')
  if (!context) return ''
  const heights = textureHeights(id, THUMBNAIL_SIZE)
  const normals = heights ? heightToNormalMap(heights, THUMBNAIL_SIZE) : null
  const image = context.createImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
  for (let y = 0; y < THUMBNAIL_SIZE; y++) {
    const sheen = SHEEN_HIGH - (SHEEN_HIGH - SHEEN_LOW) * Math.abs(Math.sin((y / THUMBNAIL_SIZE) * Math.PI * 1.2))
    for (let x = 0; x < THUMBNAIL_SIZE; x++) {
      const i = (y * THUMBNAIL_SIZE + x) * 4
      const normal = normals ? [normals[i] / 127.5 - 1, normals[i + 1] / 127.5 - 1, normals[i + 2] / 127.5 - 1] : [0, 0, 1]
      const light = Math.max(0, normal[0] * LIGHT[0] - normal[1] * LIGHT[1] + normal[2] * LIGHT[2])
      const value = Math.min(255, sheen * (0.35 + 0.75 * light))
      image.data[i] = value
      image.data[i + 1] = value
      image.data[i + 2] = Math.min(255, value * 1.04)
      image.data[i + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export function backgroundThumbnail(style: BackgroundStyleId, colors: BackgroundColors, seed: number): string {
  const canvas = document.createElement('canvas')
  paintBackground(canvas, THUMBNAIL_SIZE, style, colors, seed)
  return canvas.toDataURL('image/png')
}
