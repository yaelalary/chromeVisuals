/** Tracés vectoriels des stickers, en données SVG dans une boîte de 100 × 100 centrée sur (50, 50). */

type Point = readonly [number, number]

export interface StickerPart {
  d: string
  mode: 'fill' | 'stroke'
  width?: number
}

export interface StickerShape {
  label: string
  parts: readonly StickerPart[]
}

const CENTER = 50

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function point([x, y]: Point): string {
  return `${round(x)} ${round(y)}`
}

function rotateAround([x, y]: Point, [cx, cy]: Point, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  return [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)]
}

export function polygonPath(points: readonly Point[]): string {
  return `M ${points.map(point).join(' L ')} Z`
}

export function circlePath(cx: number, cy: number, r: number): string {
  return `M ${point([cx - r, cy])} A ${r} ${r} 0 1 0 ${point([cx + r, cy])} A ${r} ${r} 0 1 0 ${point([cx - r, cy])} Z`
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number, degrees = 0): string {
  const start = rotateAround([cx - rx, cy], [cx, cy], degrees)
  const end = rotateAround([cx + rx, cy], [cx, cy], degrees)
  const arc = `A ${rx} ${ry} ${degrees} 1 0`
  return `M ${point(start)} ${arc} ${point(end)} ${arc} ${point(start)} Z`
}

export function starPath(spikes: number, outer: number, inner: number, degrees = -90, center: Point = [CENTER, CENTER]): string {
  const points = Array.from({ length: spikes * 2 }, (_, index): Point => {
    const radius = index % 2 === 0 ? outer : inner
    const angle = ((degrees + (index * 180) / spikes) * Math.PI) / 180
    return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius]
  })
  return polygonPath(points)
}

/** Étoile à quatre branches aux flancs incurvés. */
export function sparklePath(radius: number, waist: number, [cx, cy]: Point = [CENTER, CENTER]): string {
  return [
    `M ${point([cx, cy - radius])}`,
    `Q ${point([cx + waist, cy - waist])} ${point([cx + radius, cy])}`,
    `Q ${point([cx + waist, cy + waist])} ${point([cx, cy + radius])}`,
    `Q ${point([cx - waist, cy + waist])} ${point([cx - radius, cy])}`,
    `Q ${point([cx - waist, cy - waist])} ${point([cx, cy - radius])} Z`,
  ].join(' ')
}

const HEART_POINTS: readonly Point[] = [
  [50, 86],
  [16, 62],
  [4, 36],
  [24, 21],
  [38, 11],
  [50, 21],
  [50, 32],
  [50, 21],
  [62, 11],
  [76, 21],
  [96, 36],
  [84, 62],
  [50, 86],
]

export function heartPath(scale = 1): string {
  const pivot: Point = [50, 50]
  const [start, ...curves] = HEART_POINTS.map(([x, y]): Point => [pivot[0] + (x - pivot[0]) * scale, pivot[1] + (y - pivot[1]) * scale])
  const segments = Array.from({ length: curves.length / 3 }, (_, i) => `C ${curves.slice(i * 3, i * 3 + 3).map(point).join(' ')}`)
  return `M ${point(start)} ${segments.join(' ')} Z`
}

function flowerPath(petals: number, petalRadius: number, ringRadius: number): string {
  const circles = Array.from({ length: petals }, (_, index) => {
    const angle = (index / petals) * Math.PI * 2
    return circlePath(CENTER + Math.cos(angle) * ringRadius, CENTER + Math.sin(angle) * ringRadius, petalRadius)
  })
  return [...circles, circlePath(CENTER, CENTER, ringRadius)].join(' ')
}

const fill = (d: string): StickerPart => ({ d, mode: 'fill' })
const stroke = (d: string, width: number): StickerPart => ({ d, mode: 'stroke', width })

export type StickerId =
  | 'star'
  | 'starOutline'
  | 'sparkle'
  | 'twinkle'
  | 'star8'
  | 'burst'
  | 'flower'
  | 'daisy'
  | 'heart'
  | 'heartOutline'
  | 'hearts'
  | 'smiley'
  | 'globe'
  | 'atom'
  | 'planet'
  | 'orbit'
  | 'butterfly'
  | 'lightning'
  | 'chevrons'
  | 'tunnel'
  | 'clover'
  | 'cross'

export const STICKERS: Record<StickerId, StickerShape> = {
  star: { label: 'Étoile', parts: [fill(starPath(5, 48, 20))] },
  starOutline: { label: 'Étoile contour', parts: [stroke(starPath(5, 44, 19), 5)] },
  sparkle: { label: 'Scintillement', parts: [fill(sparklePath(48, 6))] },
  twinkle: {
    label: 'Double scintillement',
    parts: [fill(sparklePath(38, 5, [42, 58])), fill(sparklePath(16, 2, [80, 20]))],
  },
  star8: { label: 'Étoile fine', parts: [fill(starPath(8, 48, 14))] },
  burst: { label: 'Éclat', parts: [fill(starPath(12, 48, 30, -90))] },
  flower: { label: 'Fleur', parts: [fill(flowerPath(6, 17, 24))] },
  daisy: { label: 'Marguerite', parts: [fill(flowerPath(10, 12, 30)), fill(circlePath(CENTER, CENTER, 15))] },
  heart: { label: 'Cœur', parts: [fill(heartPath())] },
  heartOutline: { label: 'Cœur contour', parts: [stroke(heartPath(0.92), 5)] },
  hearts: {
    label: 'Cœurs',
    parts: [stroke(heartPath(0.95), 4), stroke(heartPath(0.65), 4), stroke(heartPath(0.36), 4)],
  },
  smiley: {
    label: 'Smiley',
    parts: [
      stroke(circlePath(CENTER, CENTER, 42), 5),
      fill(ellipsePath(37, 40, 4.5, 7.5)),
      fill(ellipsePath(63, 40, 4.5, 7.5)),
      stroke('M 30 58 Q 50 78 70 58', 5),
    ],
  },
  globe: {
    label: 'Globe',
    parts: [
      stroke(circlePath(CENTER, CENTER, 44), 2.5),
      stroke(ellipsePath(CENTER, CENTER, 15, 44), 2),
      stroke(ellipsePath(CENTER, CENTER, 30, 44), 2),
      stroke('M 50 6 L 50 94', 2),
      stroke('M 6 50 L 94 50', 2),
      stroke('M 11.9 28 L 88.1 28 M 11.9 72 L 88.1 72', 2),
    ],
  },
  atom: {
    label: 'Atome',
    parts: [
      stroke(ellipsePath(CENTER, CENTER, 46, 14, 0), 3),
      stroke(ellipsePath(CENTER, CENTER, 46, 14, 60), 3),
      stroke(ellipsePath(CENTER, CENTER, 46, 14, 120), 3),
      fill(circlePath(CENTER, CENTER, 7)),
    ],
  },
  planet: {
    label: 'Planète',
    parts: [fill(circlePath(CENTER, CENTER, 25)), stroke(ellipsePath(CENTER, CENTER, 47, 13, -20), 4)],
  },
  orbit: {
    label: 'Orbite',
    parts: [stroke(ellipsePath(CENTER, CENTER, 46, 17, -15), 3), fill(circlePath(88, 38, 5)), fill(sparklePath(14, 2, [24, 30]))],
  },
  butterfly: {
    label: 'Papillon',
    parts: [
      fill(ellipsePath(32, 36, 19, 25, -30)),
      fill(ellipsePath(68, 36, 19, 25, 30)),
      fill(ellipsePath(36, 68, 13, 17, 25)),
      fill(ellipsePath(64, 68, 13, 17, -25)),
      fill(ellipsePath(CENTER, 52, 3, 28)),
    ],
  },
  lightning: {
    label: 'Éclair',
    parts: [
      fill(
        polygonPath([
          [60, 4],
          [20, 56],
          [45, 56],
          [36, 96],
          [80, 40],
          [55, 40],
          [68, 4],
        ]),
      ),
    ],
  },
  chevrons: {
    label: 'Chevrons',
    parts: [stroke('M 12 22 L 32 50 L 12 78 M 40 22 L 60 50 L 40 78 M 68 22 L 88 50 L 68 78', 9)],
  },
  tunnel: {
    label: 'Tunnel',
    parts: [45, 36, 28, 21, 15, 10].map((rx, index) => stroke(ellipsePath(CENTER, 30 + index * 8, rx, rx * 0.42), 2.5)),
  },
  clover: {
    label: 'Trèfle',
    parts: [
      fill([circlePath(34, 34, 18), circlePath(66, 34, 18), circlePath(34, 66, 18), circlePath(66, 66, 18)].join(' ')),
    ],
  },
  cross: { label: 'Croix étoilée', parts: [fill(starPath(4, 48, 5, -45)), fill(sparklePath(16, 3))] },
}
