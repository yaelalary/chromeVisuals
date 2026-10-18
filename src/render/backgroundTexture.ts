import { CanvasTexture, SRGBColorSpace } from 'three'
import type { BackgroundStyleId } from '../domain/backgrounds'
import { paintBackground, type BackgroundColors } from './backgroundPainters'

/** Résolution du fond pendant l'édition : suffisante à l'écran, et rapide à repeindre. */
export const PREVIEW_BACKGROUND_RESOLUTION = 1024
/** Résolution du fond pour l'export haute définition. */
export const EXPORT_BACKGROUND_RESOLUTION = 2048

export interface BackgroundSpec {
  style: BackgroundStyleId
  colors: BackgroundColors
  seed: number
}

export function createBackgroundTexture({ style, colors, seed }: BackgroundSpec, resolution: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  paintBackground(canvas, resolution, style, colors, seed)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
