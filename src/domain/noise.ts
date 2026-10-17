import type { Random } from './random'

export type Noise2D = (x: number, y: number) => number

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const GRADIENTS_X = [1, -1, 1, -1, 1, -1, 0, 0]
const GRADIENTS_Y = [1, 1, -1, -1, 0, 0, 1, -1]

function shuffledPermutation(random: Random): Uint8Array {
  const values = Array.from({ length: 256 }, (_, index) => index)
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  const permutation = new Uint8Array(512)
  for (let i = 0; i < permutation.length; i++) permutation[i] = values[i & 255]
  return permutation
}

function cornerContribution(gradient: number, x: number, y: number): number {
  const falloff = 0.5 - x * x - y * y
  if (falloff < 0) return 0
  const index = gradient & 7
  return falloff ** 4 * (GRADIENTS_X[index] * x + GRADIENTS_Y[index] * y)
}

/** Simplex noise 2D seedé, valeurs dans [-1, 1]. */
export function createNoise2D(random: Random): Noise2D {
  const perm = shuffledPermutation(random)

  return (x, y) => {
    const skew = (x + y) * F2
    const i = Math.floor(x + skew)
    const j = Math.floor(y + skew)
    const unskew = (i + j) * G2
    const x0 = x - (i - unskew)
    const y0 = y - (j - unskew)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255

    return (
      70 *
      (cornerContribution(perm[ii + perm[jj]], x0, y0) +
        cornerContribution(perm[ii + i1 + perm[jj + j1]], x1, y1) +
        cornerContribution(perm[ii + 1 + perm[jj + 1]], x2, y2))
    )
  }
}

export function createFractalNoise(noise: Noise2D, octaves: number): Noise2D {
  return (x, y) => {
    let sum = 0
    let amplitude = 0.5
    let frequency = 1
    for (let octave = 0; octave < octaves; octave++) {
      sum += amplitude * noise(x * frequency, y * frequency)
      frequency *= 2
      amplitude *= 0.5
    }
    return sum
  }
}
