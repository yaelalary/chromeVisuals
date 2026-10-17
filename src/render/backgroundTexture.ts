import { CanvasTexture, SRGBColorSpace } from 'three'

const GRADIENT_RESOLUTION = 256

export function createGradientTexture(top: string, bottom: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = GRADIENT_RESOLUTION
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponible')
  const gradient = context.createLinearGradient(0, 0, 0, GRADIENT_RESOLUTION)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
