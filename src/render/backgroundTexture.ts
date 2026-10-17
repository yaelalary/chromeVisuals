import { CanvasTexture, SRGBColorSpace } from 'three'
import type { BackgroundStyleId } from '../domain/backgrounds'
import { paintBackground, type BackgroundColors } from './backgroundPainters'

const BACKGROUND_RESOLUTION = 2048

export function createBackgroundTexture(style: BackgroundStyleId, colors: BackgroundColors, seed: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  paintBackground(canvas, BACKGROUND_RESOLUTION, style, colors, seed)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
