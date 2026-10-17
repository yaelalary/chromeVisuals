export type SymmetryId = 'none' | 'mirror' | 'quad' | 'kaleido'

export interface SymmetryTransform {
  mirrorX: boolean
  mirrorY: boolean
  rotation: number
}

const IDENTITY: SymmetryTransform = { mirrorX: false, mirrorY: false, rotation: 0 }
const KALEIDO_SLICES = 6

export const SYMMETRIES: Record<SymmetryId, { label: string; transforms: readonly SymmetryTransform[] }> = {
  none: { label: 'Aucune', transforms: [IDENTITY] },
  mirror: { label: 'Miroir', transforms: [IDENTITY, { ...IDENTITY, mirrorX: true }] },
  quad: {
    label: 'Quadrants',
    transforms: [
      IDENTITY,
      { ...IDENTITY, mirrorX: true },
      { ...IDENTITY, mirrorY: true },
      { ...IDENTITY, mirrorX: true, mirrorY: true },
    ],
  },
  kaleido: {
    label: 'Kaléido',
    transforms: Array.from({ length: KALEIDO_SLICES }, (_, index) => ({
      mirrorX: index % 2 === 1,
      mirrorY: false,
      rotation: (index * Math.PI * 2) / KALEIDO_SLICES,
    })),
  },
}

/** Applique une transformation de symétrie à un point du plan (miroir puis rotation). */
export function applySymmetry([x, y]: readonly [number, number], transform: SymmetryTransform): [number, number] {
  const mirroredX = transform.mirrorX ? -x : x
  const mirroredY = transform.mirrorY ? -y : y
  const cos = Math.cos(transform.rotation)
  const sin = Math.sin(transform.rotation)
  return [mirroredX * cos - mirroredY * sin, mirroredX * sin + mirroredY * cos]
}
