import { createFractalNoise, createNoise2D } from './noise'
import { createRandom } from './random'
import type { FormParams } from './shapes'

export type HeightField = (x: number, y: number) => number

const FLOW_ANGLE = Math.PI * 0.2
const FLOW_STRETCH = 0.55

/** Surface de métal liquide : bruit fractal déformé par lui-même, avec des arêtes vives. */
export function createLiquidField({ seed, density, thickness, chaos }: FormParams): HeightField {
  const noise = createNoise2D(createRandom(seed))
  const fractal = createFractalNoise(noise, 3)
  const frequency = 0.05 + density * 0.018
  const warp = 0.5 + chaos * 1.8
  const amplitude = 0.6 + thickness * 0.8
  const cos = Math.cos(FLOW_ANGLE)
  const sin = Math.sin(FLOW_ANGLE)

  return (x, y) => {
    const u = (x * cos - y * sin) * frequency
    const v = (x * sin + y * cos) * frequency * FLOW_STRETCH
    const warpedU = u + warp * fractal(u + 3.1, v + 7.7)
    const warpedV = v + warp * fractal(u + 11.4, v + 1.3)
    const ridge = 1 - Math.abs(noise(warpedU * 1.2, warpedV * 1.2))
    return amplitude * (fractal(warpedU, warpedV) + 0.3 * ridge * ridge * ridge)
  }
}
