import { frameHalfExtentAt } from './camera'
import { frameToWorld } from './drawing'
import type { Vec3 } from './vector'

/** Pixels RGBA d'une image importée, réduite à la résolution de traitement. */
export interface ImageAsset {
  name: string
  width: number
  height: number
  data: Uint8ClampedArray
  hasAlpha: boolean
  previewUrl: string
}

export type ImageTreatment = 'inflate' | 'relief'
export type ImageKeep = 'dark' | 'light'
export type ImageColors = 'chrome' | 'image'

export interface ImageLayer {
  asset: ImageAsset
  treatment: ImageTreatment
  colors: ImageColors
  keep: ImageKeep
  threshold: number
  scale: number
  depth: number
  offsetX: number
  offsetY: number
}

export interface ImageTreatmentSpec {
  label: string
  masksOpaqueImages: boolean
  mirrored: boolean
  reliefRatio: number
}

export const IMAGE_TREATMENTS: Record<ImageTreatment, ImageTreatmentSpec> = {
  inflate: { label: 'Gonflé', masksOpaqueImages: true, mirrored: true, reliefRatio: 0.12 },
  relief: { label: 'Relief', masksOpaqueImages: false, mirrored: false, reliefRatio: 0.06 },
}

export const IMAGE_KEEPS: Record<ImageKeep, { label: string }> = {
  dark: { label: 'Le sombre' },
  light: { label: 'Le clair' },
}

export const IMAGE_COLORS: Record<ImageColors, { label: string }> = {
  chrome: { label: 'Chrome' },
  image: { label: 'Image' },
}

export const IMAGE_PROCESSING_SIZE = 384
export const IMAGE_PREVIEW_SIZE = 160
const IMAGE_DEPTH = 1.2

export function createImageLayer(asset: ImageAsset): ImageLayer {
  return {
    asset,
    treatment: 'inflate',
    colors: 'chrome',
    keep: 'dark',
    threshold: 0.5,
    scale: 0.7,
    depth: 1,
    offsetX: 0,
    offsetY: 0,
  }
}

/** Le masque de forme vient du seuil de luminosité seulement pour une image opaque gonflée. */
export function usesLuminanceMask(layer: Pick<ImageLayer, 'asset' | 'treatment'>): boolean {
  return !layer.asset.hasAlpha && IMAGE_TREATMENTS[layer.treatment].masksOpaqueImages
}

export function fitWithin(width: number, height: number, maxSize: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxSize, height: maxSize }
  const ratio = Math.min(1, maxSize / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) }
}

export interface ImagePlacement {
  position: Vec3
  width: number
  reliefDepth: number
}

/** Position et taille 3D de l'image ; scale est la part de la largeur du cadre qu'elle occupe. */
export function imagePlacement(
  layer: Pick<ImageLayer, 'scale' | 'offsetX' | 'offsetY' | 'depth' | 'treatment'>,
): ImagePlacement {
  const width = layer.scale * 2 * frameHalfExtentAt(IMAGE_DEPTH)
  return {
    position: frameToWorld([0.5 + layer.offsetX, 0.5 + layer.offsetY], IMAGE_DEPTH),
    width,
    reliefDepth: width * IMAGE_TREATMENTS[layer.treatment].reliefRatio * layer.depth,
  }
}
