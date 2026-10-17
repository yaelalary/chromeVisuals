import { createRandom, randomBetween, randomInt, randomSign, type Random } from './random'
import { clamp, lerp, rotateVec3, type Vec3 } from './vector'

export type StrokeProfile = 'round' | 'spike'

export interface Stroke {
  points: Vec3[]
  closed: boolean
  radius: number
  profile: StrokeProfile
}

export interface FormParams {
  seed: number
  density: number
  thickness: number
  chaos: number
}

export type StrokeShapeId = 'ribbons' | 'zigzag' | 'tangle' | 'shards'

interface StrokeFactory {
  countFor: (density: number) => number
  create: (random: Random, params: FormParams) => Stroke
}

const FRAME_EDGE = 5.5

function pointOnFrameEdge(angle: number, depth: number): Vec3 {
  return [Math.cos(angle) * FRAME_EDGE, Math.sin(angle) * FRAME_EDGE, depth]
}

function createRibbon(random: Random, { chaos, thickness }: FormParams): Stroke {
  const entryAngle = random() * Math.PI * 2
  const exitAngle = entryAngle + Math.PI + randomBetween(random, -0.9, 0.9)
  const start = pointOnFrameEdge(entryAngle, randomBetween(random, -1, 1))
  const end = pointOnFrameEdge(exitAngle, randomBetween(random, -1, 1))
  const spread = 1 + chaos * 2
  const depth = 0.5 + chaos * 2.5
  const middleCount = randomInt(random, 2, 4)
  const middle = Array.from({ length: middleCount }, (_, index): Vec3 => {
    const t = (index + 1) / (middleCount + 1)
    return [
      lerp(start[0], end[0], t) + randomBetween(random, -spread, spread),
      lerp(start[1], end[1], t) + randomBetween(random, -spread, spread),
      randomBetween(random, -depth, depth),
    ]
  })
  return {
    points: [start, ...middle, end],
    closed: false,
    radius: thickness * randomBetween(random, 0.28, 0.42),
    profile: 'round',
  }
}

function createZigzag(random: Random, { chaos, thickness }: FormParams): Stroke {
  const angle = random() * Math.PI
  const along: Vec3 = [Math.cos(angle), Math.sin(angle), 0]
  const across: Vec3 = [-Math.sin(angle), Math.cos(angle), 0]
  const offset = randomBetween(random, -2, 2)
  const turns = randomInt(random, 4, 6)
  const amplitude = randomBetween(random, 1.2, 2.2)
  const depth = 0.3 + chaos * 1.5
  const points = Array.from({ length: turns + 1 }, (_, index): Vec3 => {
    const u = lerp(-FRAME_EDGE - 1, FRAME_EDGE + 1, index / turns)
    const side = (index % 2 === 0 ? 1 : -1) * amplitude * randomBetween(random, 1 - chaos * 0.4, 1.1) + offset
    return [
      along[0] * u + across[0] * side,
      along[1] * u + across[1] * side,
      randomBetween(random, -depth, depth),
    ]
  })
  return { points, closed: false, radius: thickness * randomBetween(random, 0.32, 0.45), profile: 'round' }
}

function createTangleLoop(random: Random, { chaos, thickness }: FormParams): Stroke {
  const pointCount = randomInt(random, 6, 9)
  const baseRadius = randomBetween(random, 1.4, 3.2)
  const wobble = 0.1 + chaos * 0.45
  const depth = 0.3 + chaos
  const tiltAmount = 0.4 + chaos * 0.6
  const tilt: Vec3 = [
    random() * Math.PI * tiltAmount,
    random() * Math.PI * tiltAmount,
    random() * Math.PI * 2,
  ]
  const points = Array.from({ length: pointCount }, (_, index): Vec3 => {
    const angle = (index / pointCount) * Math.PI * 2
    const radius = baseRadius * randomBetween(random, 1 - wobble, 1 + wobble)
    return rotateVec3([Math.cos(angle) * radius, Math.sin(angle) * radius, randomBetween(random, -depth, depth)], tilt)
  })
  const isThick = random() < 0.3
  return {
    points,
    closed: true,
    radius: thickness * (isThick ? randomBetween(random, 0.18, 0.3) : randomBetween(random, 0.05, 0.14)),
    profile: 'round',
  }
}

function createShard(random: Random, { chaos, thickness }: FormParams): Stroke {
  const steps = 6
  const startAngle = random() * Math.PI * 2
  const sweep = randomBetween(random, 1.2, 3.6) * randomSign(random)
  const innerRadius = randomBetween(random, 0.3, 2)
  const outerRadius = randomBetween(random, 1.5, 5)
  const depth = 0.4 * (1 + chaos * 2)
  const tiltAmount = 0.3 + chaos
  const tilt: Vec3 = [randomBetween(random, -1.2, 1.2) * tiltAmount, randomBetween(random, -1.2, 1.2) * tiltAmount, 0]
  const points = Array.from({ length: steps + 1 }, (_, index): Vec3 => {
    const t = index / steps
    const angle = startAngle + sweep * t
    const radius = lerp(innerRadius, outerRadius, t)
    return rotateVec3([Math.cos(angle) * radius, Math.sin(angle) * radius, randomBetween(random, -depth, depth)], tilt)
  })
  return { points, closed: false, radius: thickness * randomBetween(random, 0.04, 0.16), profile: 'spike' }
}

const STROKE_FACTORIES: Record<StrokeShapeId, StrokeFactory> = {
  ribbons: { countFor: (density) => density, create: createRibbon },
  zigzag: { countFor: (density) => Math.ceil(density / 2), create: createZigzag },
  tangle: { countFor: (density) => density * 2, create: createTangleLoop },
  shards: { countFor: (density) => density * 3, create: createShard },
}

export function generateStrokes(shapeId: StrokeShapeId, params: FormParams): Stroke[] {
  const random = createRandom(params.seed)
  const factory = STROKE_FACTORIES[shapeId]
  return Array.from({ length: factory.countFor(params.density) }, () => factory.create(random, params))
}

/**
 * Facteur de rayon (0..1) le long d'un trait, t dans [0, 1].
 * capFraction : part de la longueur occupée par l'arrondi d'extrémité.
 */
export function strokeRadiusAt(stroke: Pick<Stroke, 'profile' | 'closed'>, t: number, capFraction: number): number {
  const position = clamp(t, 0, 1)
  if (stroke.profile === 'spike') return Math.sin(Math.PI * position) ** 0.7
  if (stroke.closed || capFraction <= 0) return 1
  const edge = Math.min(position, 1 - position) / capFraction
  if (edge >= 1) return 1
  return Math.sqrt(1 - (1 - edge) ** 2)
}
