import { IMAGE_TREATMENTS, usesLuminanceMask, type ImageAsset, type ImageLayer } from './imageLayer'
import { clamp } from './vector'

export interface ImageRelief {
  width: number
  height: number
  heights: Float32Array
  mask: Float32Array
  colors: Float32Array
}

type ReliefOptions = Pick<ImageLayer, 'treatment' | 'keep' | 'threshold'>

const OPAQUE_ALPHA = 250
const MASK_SOFTNESS = 0.04
const INFLATE_RADIUS_RATIO = 0.09
const LUMINANCE_BLUR_RADIUS = 2
const INFLATE_BLUR_RADIUS = 2
const FAR = 1e20

export function hasTransparency(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) if (data[i] < OPAQUE_ALPHA) return true
  return false
}

function luminanceAt(data: Uint8ClampedArray, pixel: number): number {
  const i = pixel * 4
  return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Masque de forme dans [0, 1] : l'alpha si l'image en a, sinon un seuil de luminosité (ou l'image entière). */
export function extractMask(asset: ImageAsset, options: ReliefOptions): Float32Array {
  const count = asset.width * asset.height
  const mask = new Float32Array(count)
  const luminanceMask = usesLuminanceMask({ asset, treatment: options.treatment })
  for (let pixel = 0; pixel < count; pixel++) {
    if (asset.hasAlpha) mask[pixel] = asset.data[pixel * 4 + 3] / 255
    else if (!luminanceMask) mask[pixel] = 1
    else {
      const light = smoothstep(options.threshold - MASK_SOFTNESS, options.threshold + MASK_SOFTNESS, luminanceAt(asset.data, pixel))
      mask[pixel] = options.keep === 'light' ? light : 1 - light
    }
  }
  return mask
}

function distanceTransform1D(f: Float64Array, n: number, out: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0
  v[0] = 0
  z[0] = -FAR
  z[1] = FAR
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k--
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = FAR
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    out[q] = (q - v[k]) ** 2 + f[v[k]]
  }
}

/**
 * Distance euclidienne au carré de chaque pixel intérieur jusqu'au pixel extérieur le plus proche
 * (Felzenszwalb & Huttenlocher). Le pourtour de l'image compte comme extérieur.
 */
export function squaredDistanceToOutside(inside: ArrayLike<boolean>, width: number, height: number): Float64Array {
  const paddedWidth = width + 2
  const paddedHeight = height + 2
  const grid = new Float64Array(paddedWidth * paddedHeight)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (inside[y * width + x]) grid[(y + 1) * paddedWidth + x + 1] = FAR
    }
  }

  const longest = Math.max(paddedWidth, paddedHeight)
  const f = new Float64Array(longest)
  const out = new Float64Array(longest)
  const v = new Int32Array(longest)
  const z = new Float64Array(longest + 1)

  for (let x = 0; x < paddedWidth; x++) {
    for (let y = 0; y < paddedHeight; y++) f[y] = grid[y * paddedWidth + x]
    distanceTransform1D(f, paddedHeight, out, v, z)
    for (let y = 0; y < paddedHeight; y++) grid[y * paddedWidth + x] = out[y]
  }
  for (let y = 0; y < paddedHeight; y++) {
    for (let x = 0; x < paddedWidth; x++) f[x] = grid[y * paddedWidth + x]
    distanceTransform1D(f, paddedWidth, out, v, z)
    for (let x = 0; x < paddedWidth; x++) grid[y * paddedWidth + x] = out[x]
  }

  const result = new Float64Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) result[y * width + x] = grid[(y + 1) * paddedWidth + x + 1]
  }
  return result
}

/** Flou boîte séparable, bords étendus. */
export function boxBlur(field: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (radius <= 0) return field.slice()
  const horizontal = new Float32Array(field.length)
  const result = new Float32Array(field.length)
  const span = radius * 2 + 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += field[y * width + clamp(x + k, 0, width - 1)]
      horizontal[y * width + x] = sum / span
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += horizontal[clamp(y + k, 0, height - 1) * width + x]
      result[y * width + x] = sum / span
    }
  }
  return result
}

/** Profil arrondi d'un ballon : monte en quart de cercle depuis le bord puis plafonne à 1. */
function inflateHeights(mask: Float32Array, width: number, height: number): Float32Array {
  const inside = Array.from(mask, (value) => value >= 0.5)
  const squared = squaredDistanceToOutside(inside, width, height)
  const radius = Math.max(1, INFLATE_RADIUS_RATIO * Math.max(width, height))
  const heights = new Float32Array(mask.length)
  for (let i = 0; i < heights.length; i++) {
    const t = Math.min(Math.sqrt(squared[i]) / radius, 1)
    heights[i] = Math.sqrt(1 - (1 - t) ** 2)
  }
  const smoothed = boxBlur(boxBlur(heights, width, height, INFLATE_BLUR_RADIUS), width, height, INFLATE_BLUR_RADIUS)
  return smoothed.map((value, i) => (inside[i] ? value : 0))
}

function luminanceHeights(asset: ImageAsset): Float32Array {
  const luminance = Float32Array.from({ length: asset.width * asset.height }, (_, pixel) => luminanceAt(asset.data, pixel))
  return boxBlur(luminance, asset.width, asset.height, LUMINANCE_BLUR_RADIUS)
}

const HEIGHT_BUILDERS: Record<ReliefOptions['treatment'], (asset: ImageAsset, mask: Float32Array) => Float32Array> = {
  inflate: (asset, mask) => inflateHeights(mask, asset.width, asset.height),
  relief: (asset) => luminanceHeights(asset),
}

function extractColors(asset: ImageAsset): Float32Array {
  const colors = new Float32Array(asset.width * asset.height * 3)
  for (let pixel = 0; pixel < asset.width * asset.height; pixel++) {
    for (let channel = 0; channel < 3; channel++) colors[pixel * 3 + channel] = asset.data[pixel * 4 + channel] / 255
  }
  return colors
}

/** Champ de hauteur dans [0, 1], masque et couleurs sRGB, prêts à devenir une surface chrome. */
export function buildImageRelief(asset: ImageAsset, options: ReliefOptions): ImageRelief {
  const mask = extractMask(asset, options)
  return {
    width: asset.width,
    height: asset.height,
    heights: HEIGHT_BUILDERS[options.treatment](asset, mask),
    mask,
    colors: extractColors(asset),
  }
}

export function isMirrored(treatment: ReliefOptions['treatment']): boolean {
  return IMAGE_TREATMENTS[treatment].mirrored
}
