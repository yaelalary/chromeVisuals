export type Vec3 = readonly [number, number, number]

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function rotateVec3([x, y, z]: Vec3, [rx, ry, rz]: Vec3): Vec3 {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx)
  const z1 = y * Math.sin(rx) + z * Math.cos(rx)
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
  const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz)
  const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz)
  return [x3, y3, z2]
}
