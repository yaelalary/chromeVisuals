import { describe, expect, it } from 'vitest'
import { frameHalfExtentAt, CAMERA_DISTANCE } from './camera'
import { applyLook, createCoverSettings } from './cover'
import {
  brushRadius,
  drawnStrokesToStrokes,
  frameToWorld,
  isClosedPath,
  isDrawablePath,
  simplifyPath,
  type DrawnStroke,
  type Point2,
} from './drawing'
import { describeForm } from './sceneForm'

const PARAMS = { seed: 3, thickness: 1, chaos: 0 }

function projectToFrame([x, y, z]: readonly [number, number, number]): Point2 {
  const half = frameHalfExtentAt(z)
  return [(x / half + 1) / 2, (1 - y / half) / 2]
}

function circle(count: number, radius = 0.2): Point2[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return [0.5 + Math.cos(angle) * radius, 0.5 + Math.sin(angle) * radius] as const
  })
}

describe('simplifyPath', () => {
  it('retire les points trop rapprochés en gardant les extrémités', () => {
    const points: Point2[] = [
      [0, 0],
      [0.001, 0],
      [0.002, 0],
      [0.1, 0],
      [0.2, 0],
    ]
    expect(simplifyPath(points, 0.05)).toEqual([
      [0, 0],
      [0.1, 0],
      [0.2, 0],
    ])
  })

  it('remplace le dernier point gardé par le point final s’ils sont trop proches', () => {
    expect(
      simplifyPath(
        [
          [0, 0],
          [0.1, 0],
          [0.11, 0],
        ],
        0.05,
      ),
    ).toEqual([
      [0, 0],
      [0.11, 0],
    ])
  })

  it('laisse intact un tracé trop court', () => {
    expect(simplifyPath([[0.5, 0.5]])).toEqual([[0.5, 0.5]])
  })
})

describe('isDrawablePath', () => {
  it('refuse un simple clic', () => {
    expect(isDrawablePath([[0.5, 0.5]])).toBe(false)
    expect(
      isDrawablePath([
        [0.5, 0.5],
        [0.5, 0.5],
      ]),
    ).toBe(false)
  })

  it('accepte un trait', () => {
    expect(
      isDrawablePath([
        [0.1, 0.1],
        [0.4, 0.4],
      ]),
    ).toBe(true)
  })
})

describe('isClosedPath', () => {
  it('détecte un tracé qui revient à son départ', () => {
    expect(isClosedPath(circle(24))).toBe(true)
  })

  it('ne ferme pas un trait ouvert', () => {
    expect(isClosedPath(circle(24).slice(0, 18))).toBe(false)
  })

  it('ne ferme pas un gribouillis minuscule', () => {
    expect(isClosedPath(circle(8, 0.005))).toBe(false)
  })
})

describe('frameToWorld', () => {
  it('place le centre du cadre sur l’axe de la caméra', () => {
    const [x, y] = frameToWorld([0.5, 0.5], 0)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('retombe à l’écran exactement là où le point a été dessiné, quelle que soit la profondeur', () => {
    for (const depth of [-2, 0, 1.5]) {
      const projected = projectToFrame(frameToWorld([0.2, 0.8], depth))
      expect(projected[0]).toBeCloseTo(0.2)
      expect(projected[1]).toBeCloseTo(0.8)
    }
  })

  it('oriente y vers le haut en 3D', () => {
    expect(frameToWorld([0.5, 0], 0)[1]).toBeCloseTo(frameHalfExtentAt(0))
    expect(frameHalfExtentAt(CAMERA_DISTANCE)).toBe(0)
  })
})

describe('drawnStrokesToStrokes', () => {
  const open: DrawnStroke = {
    points: [
      [0.1, 0.1],
      [0.5, 0.4],
      [0.9, 0.2],
    ],
    size: 2,
    profile: 'spike',
  }

  it('reprend le profil et calcule le rayon depuis la taille et l’épaisseur', () => {
    const [stroke] = drawnStrokesToStrokes([open], { ...PARAMS, thickness: 1.5 })
    expect(stroke.profile).toBe('spike')
    expect(stroke.radius).toBeCloseTo(brushRadius(2, 1.5))
    expect(stroke.closed).toBe(false)
    expect(stroke.points).toHaveLength(3)
  })

  it('ferme une boucle en retirant le point de fermeture dupliqué', () => {
    const loop: DrawnStroke = { points: circle(24), size: 1, profile: 'round' }
    const [stroke] = drawnStrokesToStrokes([loop], PARAMS)
    expect(stroke.closed).toBe(true)
    expect(stroke.points).toHaveLength(24)
  })

  it('garde une profondeur continue à la jonction d’une boucle', () => {
    const loop: DrawnStroke = { points: circle(60, 0.3), size: 1, profile: 'round' }
    for (const seed of [1, 2, 3, 4, 5]) {
      const [stroke] = drawnStrokesToStrokes([loop], { ...PARAMS, seed, chaos: 1 })
      const depths = stroke.points.map((point) => point[2])
      const steps = depths.slice(1).map((depth, i) => Math.abs(depth - depths[i]))
      const seamStep = Math.abs(depths[0] - depths[depths.length - 1])
      expect(seamStep).toBeLessThanOrEqual(Math.max(...steps) * 1.5)
    }
  })

  it('fait onduler la profondeur avec le chaos sans déplacer le dessin à l’écran', () => {
    const [flat] = drawnStrokesToStrokes([open], PARAMS)
    const [wavy] = drawnStrokesToStrokes([open], { ...PARAMS, chaos: 1 })
    expect(wavy.points.map((p) => p[2])).not.toEqual(flat.points.map((p) => p[2]))
    wavy.points.forEach((point, i) => {
      const projected = projectToFrame(point)
      expect(projected[0]).toBeCloseTo(open.points[i][0])
      expect(projected[1]).toBeCloseTo(open.points[i][1])
    })
  })
})

describe('motif Dessin', () => {
  it('produit des traits à partir des tracés de la cover', () => {
    const settings = { ...createCoverSettings('chrome', 1), shapeId: 'drawn' as const, drawnStrokes: [open()] }
    const form = describeForm(settings)
    expect(form.kind === 'strokes' && form.strokes).toHaveLength(1)
  })

  it('reste actif quand on change d’ambiance', () => {
    const settings = { ...createCoverSettings('chrome', 1), shapeId: 'drawn' as const, drawnStrokes: [open()] }
    const result = applyLook(settings, 'holo')
    expect(result.shapeId).toBe('drawn')
    expect(result.drawnStrokes).toHaveLength(1)
  })

  it('les autres motifs suivent toujours l’ambiance', () => {
    expect(applyLook({ ...createCoverSettings('chrome', 1), shapeId: 'zigzag' }, 'holo').shapeId).toBe('liquid')
  })
})

function open(): DrawnStroke {
  return {
    points: [
      [0.2, 0.2],
      [0.8, 0.8],
    ],
    size: 1,
    profile: 'round',
  }
}
