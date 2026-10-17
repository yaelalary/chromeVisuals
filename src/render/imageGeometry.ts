import { BufferGeometry, Color, Float32BufferAttribute, SRGBColorSpace } from 'three'
import type { ImageRelief } from '../domain/imageRelief'

const MASK_CUTOFF = 0.5
const OUTLINE_SMOOTHING_PASSES = 6
const OUTLINE_SMOOTHING_WEIGHT = 0.5
const IMAGE_UV_SCALE = 3

interface ImageGeometryOptions {
  mirrored: boolean
  withColors: boolean
}

interface Grid {
  width: number
  height: number
  included: Uint8Array
}

function linearColors(relief: ImageRelief): number[] {
  const color = new Color()
  const result: number[] = []
  for (let i = 0; i < relief.colors.length; i += 3) {
    color.setRGB(relief.colors[i], relief.colors[i + 1], relief.colors[i + 2], SRGBColorSpace)
    result.push(color.r, color.g, color.b)
  }
  return result
}

function includedCells({ width, height, mask }: ImageRelief): Uint8Array {
  const included = new Uint8Array((width - 1) * (height - 1))
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const corners = [y * width + x, (y + 1) * width + x, (y + 1) * width + x + 1, y * width + x + 1]
      included[y * (width - 1) + x] = corners.every((corner) => mask[corner] >= MASK_CUTOFF) ? 1 : 0
    }
  }
  return included
}

function cellIncluded({ width, height, included }: Grid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= width - 1 || y >= height - 1) return false
  return included[y * (width - 1) + x] === 1
}

/** Sommets utilisés qui touchent une cellule exclue : ils forment le contour de la forme. */
function outlineVertices(grid: Grid): Uint8Array {
  const outline = new Uint8Array(grid.width * grid.height)
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cells = [cellIncluded(grid, x - 1, y - 1), cellIncluded(grid, x, y - 1), cellIncluded(grid, x - 1, y), cellIncluded(grid, x, y)]
      if (cells.some(Boolean) && !cells.every(Boolean)) outline[y * grid.width + x] = 1
    }
  }
  return outline
}

/** Adoucit l'escalier du contour en rapprochant chaque sommet du bord de la moyenne de ses voisins de bord. */
function smoothOutline(grid: Grid, xs: Float32Array, ys: Float32Array): void {
  const outline = outlineVertices(grid)
  const { width, height } = grid
  for (let pass = 0; pass < OUTLINE_SMOOTHING_PASSES; pass++) {
    const nextX = xs.slice()
    const nextY = ys.slice()
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        if (!outline[index]) continue
        let sumX = 0
        let sumY = 0
        let count = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height || !outline[ny * width + nx]) continue
            sumX += xs[ny * width + nx]
            sumY += ys[ny * width + nx]
            count++
          }
        }
        nextX[index] = xs[index] + (sumX / count - xs[index]) * OUTLINE_SMOOTHING_WEIGHT
        nextY[index] = ys[index] + (sumY / count - ys[index]) * OUTLINE_SMOOTHING_WEIGHT
      }
    }
    xs.set(nextX)
    ys.set(nextY)
  }
}

/**
 * Surface de largeur 1 centrée sur l'origine, hauteurs dans [0, 1] sur z.
 * Seules les cellules entièrement dans le masque sont gardées ; la version miroir ferme le volume par l'arrière.
 */
export function buildImageGeometry(relief: ImageRelief, { mirrored, withColors }: ImageGeometryOptions): BufferGeometry {
  const { width, height, heights } = relief
  const aspect = height / width
  const layers = mirrored ? [1, -1] : [1]
  const pixelCount = width * height
  const grid: Grid = { width, height, included: includedCells(relief) }

  const xs = new Float32Array(pixelCount)
  const ys = new Float32Array(pixelCount)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      xs[y * width + x] = x / (width - 1 || 1) - 0.5
      ys[y * width + x] = (0.5 - y / (height - 1 || 1)) * aspect
    }
  }
  smoothOutline(grid, xs, ys)

  const positions: number[] = []
  const uvs: number[] = []
  for (const side of layers) {
    for (let i = 0; i < pixelCount; i++) {
      positions.push(xs[i], ys[i], side * heights[i])
      uvs.push(xs[i] * IMAGE_UV_SCALE, ys[i] * IMAGE_UV_SCALE)
    }
  }

  const indices: number[] = []
  layers.forEach((side, layer) => {
    const offset = layer * pixelCount
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        if (!cellIncluded(grid, x, y)) continue
        const a = offset + y * width + x
        const b = offset + (y + 1) * width + x
        const c = offset + (y + 1) * width + x + 1
        const d = offset + y * width + x + 1
        if (side > 0) indices.push(a, b, d, b, c, d)
        else indices.push(a, d, b, b, d, c)
      }
    }
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  if (withColors) {
    const colors = linearColors(relief)
    geometry.setAttribute('color', new Float32BufferAttribute(mirrored ? [...colors, ...colors] : colors, 3))
  }
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
