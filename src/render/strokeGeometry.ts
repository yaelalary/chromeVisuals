import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'
import { strokeRadiusAt, type Stroke } from '../domain/shapes'
import { clamp } from '../domain/vector'

const RADIAL_SEGMENTS = 40
const SEGMENTS_PER_UNIT = 40
const MIN_SEGMENTS = 32
const MAX_SEGMENTS = 2400

/** Tube à rayon variable le long d'une courbe (même convention de faces que TubeGeometry). */
export function buildStrokeGeometry(stroke: Stroke): BufferGeometry {
  const curve = new CatmullRomCurve3(
    stroke.points.map((point) => new Vector3(...point)),
    stroke.closed,
    'centripetal',
  )
  const length = curve.getLength()
  const segments = clamp(Math.round(length * SEGMENTS_PER_UNIT), MIN_SEGMENTS, MAX_SEGMENTS)
  const frames = curve.computeFrenetFrames(segments, stroke.closed)
  const capFraction = stroke.radius / length

  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const center = new Vector3()
  const normal = new Vector3()

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    curve.getPointAt(t, center)
    const radius = stroke.radius * strokeRadiusAt(stroke, t, capFraction)
    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
      const angle = (j / RADIAL_SEGMENTS) * Math.PI * 2
      normal
        .copy(frames.normals[i])
        .multiplyScalar(-Math.cos(angle))
        .addScaledVector(frames.binormals[i], Math.sin(angle))
        .normalize()
      normals.push(normal.x, normal.y, normal.z)
      positions.push(center.x + radius * normal.x, center.y + radius * normal.y, center.z + radius * normal.z)
    }
  }

  const ring = RADIAL_SEGMENTS + 1
  for (let i = 1; i <= segments; i++) {
    for (let j = 1; j <= RADIAL_SEGMENTS; j++) {
      const a = ring * (i - 1) + (j - 1)
      const b = ring * i + (j - 1)
      const c = ring * i + j
      const d = ring * (i - 1) + j
      indices.push(a, b, d, b, c, d)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  return geometry
}
