import { createRandom, randomBetween, type Random } from './random'

export type SurfaceTextureId = 'smooth' | 'brushed' | 'hammered' | 'ripples' | 'sandblasted' | 'dots' | 'diamond'

type HeightPattern = (size: number, random: Random) => Float32Array

export interface SurfaceTextureSpec {
  label: string
  pattern: HeightPattern | null
  roughness: number
  anisotropy: number
  relief: number
}

export const TEXTURE_RESOLUTION = 256
/** Taille en unités 3D d'une répétition de texture à l'échelle 1. */
export const TEXTURE_WORLD_SIZE = 1.2

/** Nombre de répétitions de texture autour d'un tube, à l'échelle 1. */
export const TUBE_AROUND_REPEATS = 2

const TEXTURE_SEED = 7
const NORMAL_SLOPE = 8

function wrap(index: number, size: number): number {
  return ((index % size) + size) % size
}

/** Distance la plus courte sur un tore unité, pour que les motifs se raccordent bord à bord. */
function wrappedDelta(a: number, b: number): number {
  const delta = Math.abs(a - b)
  return Math.min(delta, 1 - delta)
}

export function normalize01(field: Float32Array): Float32Array {
  let min = Infinity
  let max = -Infinity
  for (const value of field) {
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  const range = max - min
  return field.map((value) => (range > 0 ? (value - min) / range : 0))
}

/** Flou boîte qui boucle sur les bords, pour garder la texture raccordable. */
export function blurWrapped(field: Float32Array, size: number, radius: number): Float32Array {
  const horizontal = new Float32Array(field.length)
  const result = new Float32Array(field.length)
  const span = radius * 2 + 1
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += field[y * size + wrap(x + k, size)]
      horizontal[y * size + x] = sum / span
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += horizontal[wrap(y + k, size) * size + x]
      result[y * size + x] = sum / span
    }
  }
  return result
}

function fieldFrom(size: number, heightAt: (u: number, v: number) => number): Float32Array {
  const field = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) field[y * size + x] = heightAt(x / size, y / size)
  }
  return field
}

/** Stries fines constantes le long de u : le métal est brossé dans le sens de la longueur. */
const brushed: HeightPattern = (size, random) => {
  const rows = Array.from({ length: size }, () => random())
  return blurWrapped(
    fieldFrom(size, (_u, v) => rows[Math.floor(v * size)]),
    size,
    1,
  )
}

const hammered: HeightPattern = (size, random) => {
  const points = Array.from({ length: 22 }, () => [random(), random()] as const)
  return blurWrapped(
    fieldFrom(size, (u, v) => {
      let nearest = Infinity
      for (const [px, py] of points) nearest = Math.min(nearest, Math.hypot(wrappedDelta(u, px), wrappedDelta(v, py)))
      return nearest * nearest
    }),
    size,
    3,
  )
}

const ripples: HeightPattern = (_size, random) => {
  const waves = [
    [3, 1],
    [1, 4],
    [-2, 3],
    [5, -2],
    [4, 4],
  ].map(([kx, ky]) => ({ kx, ky, phase: randomBetween(random, 0, Math.PI * 2) }))
  return fieldFrom(_size, (u, v) =>
    waves.reduce((sum, { kx, ky, phase }) => sum + Math.sin(2 * Math.PI * (kx * u + ky * v) + phase) / Math.hypot(kx, ky), 0),
  )
}

const sandblasted: HeightPattern = (size, random) =>
  blurWrapped(Float32Array.from({ length: size * size }, () => random()), size, 1)

const DOT_COLUMNS = 8
const DOT_ROWS = 8

const dots: HeightPattern = (size) =>
  blurWrapped(
    fieldFrom(size, (u, v) => {
      const row = Math.floor(v * DOT_ROWS)
      const shift = row % 2 === 0 ? 0 : 0.5
      const cellU = ((u * DOT_COLUMNS + shift) % 1) - 0.5
      const cellV = ((v * DOT_ROWS) % 1) - 0.5
      const distance = Math.hypot(cellU, cellV) / 0.42
      return distance < 1 ? Math.sqrt(1 - distance * distance) : 0
    }),
    size,
    1,
  )

const DIAMOND_CELLS = 8

const diamond: HeightPattern = (size) =>
  blurWrapped(
    fieldFrom(size, (u, v) => {
      const column = Math.floor(u * DIAMOND_CELLS)
      const row = Math.floor(v * DIAMOND_CELLS)
      const angle = (column + row) % 2 === 0 ? Math.PI / 4 : -Math.PI / 4
      const localU = ((u * DIAMOND_CELLS) % 1) - 0.5
      const localV = ((v * DIAMOND_CELLS) % 1) - 0.5
      const along = localU * Math.cos(angle) + localV * Math.sin(angle)
      const across = -localU * Math.sin(angle) + localV * Math.cos(angle)
      const shape = (along / 0.42) ** 2 + (across / 0.12) ** 2
      return shape < 1 ? Math.sqrt(1 - shape) : 0
    }),
    size,
    1,
  )

export const SURFACE_TEXTURES: Record<SurfaceTextureId, SurfaceTextureSpec> = {
  smooth: { label: 'Lisse', pattern: null, roughness: 0, anisotropy: 0, relief: 0 },
  brushed: { label: 'Brossé', pattern: brushed, roughness: 0.12, anisotropy: 0.8, relief: 1 },
  hammered: { label: 'Martelé', pattern: hammered, roughness: 0.02, anisotropy: 0, relief: 0.45 },
  ripples: { label: 'Ondes', pattern: ripples, roughness: 0, anisotropy: 0, relief: 1 },
  sandblasted: { label: 'Sablé', pattern: sandblasted, roughness: 0.3, anisotropy: 0, relief: 1 },
  dots: { label: 'Pastilles', pattern: dots, roughness: 0, anisotropy: 0, relief: 1 },
  diamond: { label: 'Tôle', pattern: diamond, roughness: 0.04, anisotropy: 0, relief: 1 },
}

/**
 * Répétition de la texture en u et v pour une échelle donnée. En v, elle est arrondie pour que
 * le tour d'un tube compte toujours un nombre entier de motifs : sinon la jointure se voit.
 */
export function seamlessRepeat(scale: number): [number, number] {
  const around = Math.max(1, Math.round(TUBE_AROUND_REPEATS * scale))
  return [scale, around / TUBE_AROUND_REPEATS]
}

/** Champ de hauteur raccordable dans [0, 1], ou null pour une surface lisse. */
export function textureHeights(id: SurfaceTextureId, size = TEXTURE_RESOLUTION): Float32Array | null {
  const pattern = SURFACE_TEXTURES[id].pattern
  return pattern ? normalize01(pattern(size, createRandom(TEXTURE_SEED))) : null
}

/** Carte de normales RGBA (convention OpenGL, v vers le haut) calculée par différences centrées qui bouclent. */
export function heightToNormalMap(heights: Float32Array, size: number): Uint8Array {
  const pixels = new Uint8Array(size * size * 4)
  const slope = (NORMAL_SLOPE * size) / TEXTURE_RESOLUTION
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const du = (heights[y * size + wrap(x + 1, size)] - heights[y * size + wrap(x - 1, size)]) * slope
      const dv = (heights[wrap(y + 1, size) * size + x] - heights[wrap(y - 1, size) * size + x]) * slope
      const length = Math.hypot(du, dv, 1)
      const i = (y * size + x) * 4
      pixels[i] = Math.round(((-du / length) * 0.5 + 0.5) * 255)
      pixels[i + 1] = Math.round(((-dv / length) * 0.5 + 0.5) * 255)
      pixels[i + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255)
      pixels[i + 3] = 255
    }
  }
  return pixels
}
