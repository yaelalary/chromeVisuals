import type { BackgroundStyleId } from '../domain/backgrounds'
import { createFractalNoise, createNoise2D } from '../domain/noise'
import { createRandom, randomBetween, type Random } from '../domain/random'
import { drawSparkle } from './sparkle'

export interface BackgroundColors {
  top: string
  bottom: string
}

type Painter = (context: CanvasRenderingContext2D, size: number, colors: BackgroundColors, random: Random) => void

const HORIZON = 0.56
const GRID_COLUMNS = 22
const GRID_ROWS = 14
const STAR_DOTS = 420
const STAR_SPARKLES = 10
const HALFTONE_CELLS = 46
const RAY_COUNT = 24
const CLOUD_RESOLUTION = 256

function fillLinear(context: CanvasRenderingContext2D, size: number, from: string, to: string): void {
  const gradient = context.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, from)
  gradient.addColorStop(1, to)
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
}

function parseHex(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const paintGradient: Painter = (context, size, { top, bottom }) => fillLinear(context, size, top, bottom)

const paintRadial: Painter = (context, size, { top, bottom }) => {
  const gradient = context.createRadialGradient(size * 0.5, size * 0.42, 0, size * 0.5, size * 0.42, size * 0.75)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
}

/** Grille rétro en perspective sous une ligne d'horizon lumineuse. */
const paintGrid: Painter = (context, size, { top, bottom }) => {
  fillLinear(context, size, bottom, bottom)
  const horizon = size * HORIZON
  const glow = context.createLinearGradient(0, horizon - size * 0.25, 0, horizon + size * 0.05)
  glow.addColorStop(0, withAlpha(top, 0))
  glow.addColorStop(1, withAlpha(top, 0.55))
  context.fillStyle = glow
  context.fillRect(0, 0, size, horizon + size * 0.05)

  context.strokeStyle = withAlpha(top, 0.8)
  context.lineWidth = Math.max(1, size / 700)
  context.beginPath()
  for (let column = -GRID_COLUMNS; column <= GRID_COLUMNS; column++) {
    context.moveTo(size / 2, horizon)
    context.lineTo(size / 2 + (column / GRID_COLUMNS) * size * 2.2, size)
  }
  for (let row = 1; row <= GRID_ROWS; row++) {
    const y = horizon + (size - horizon) * (row / GRID_ROWS) ** 2
    context.moveTo(0, y)
    context.lineTo(size, y)
  }
  context.stroke()
}

const paintStars: Painter = (context, size, colors, random) => {
  fillLinear(context, size, colors.top, colors.bottom)
  for (let i = 0; i < STAR_DOTS; i++) {
    context.fillStyle = `rgba(255, 255, 255, ${randomBetween(random, 0.2, 0.9)})`
    context.beginPath()
    context.arc(random() * size, random() * size, randomBetween(random, 0.4, 1.6) * (size / 1000), 0, Math.PI * 2)
    context.fill()
  }
  for (let i = 0; i < STAR_SPARKLES; i++) {
    drawSparkle(context, random() * size, random() * size, randomBetween(random, 0.008, 0.025) * size)
  }
}

/** Trame de points dont la taille grandit vers le bas. */
const paintHalftone: Painter = (context, size, { top, bottom }) => {
  fillLinear(context, size, bottom, bottom)
  const cell = size / HALFTONE_CELLS
  context.fillStyle = withAlpha(top, 0.85)
  for (let row = 0; row <= HALFTONE_CELLS; row++) {
    const radius = (cell / 2) * (row / HALFTONE_CELLS) ** 1.3
    for (let column = 0; column <= HALFTONE_CELLS; column++) {
      const offset = row % 2 === 0 ? 0 : cell / 2
      context.beginPath()
      context.arc(column * cell + offset, row * cell, radius, 0, Math.PI * 2)
      context.fill()
    }
  }
}

const paintRays: Painter = (context, size, { top, bottom }) => {
  fillLinear(context, size, bottom, bottom)
  const centerX = size * 0.5
  const centerY = size * 0.45
  const reach = size * 1.5
  context.fillStyle = top
  for (let ray = 0; ray < RAY_COUNT; ray += 2) {
    const start = (ray / RAY_COUNT) * Math.PI * 2
    const end = ((ray + 1) / RAY_COUNT) * Math.PI * 2
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(centerX + Math.cos(start) * reach, centerY + Math.sin(start) * reach)
    context.lineTo(centerX + Math.cos(end) * reach, centerY + Math.sin(end) * reach)
    context.closePath()
    context.fill()
  }
  const vignette = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.8)
  vignette.addColorStop(0, withAlpha(bottom, 0))
  vignette.addColorStop(1, withAlpha(bottom, 0.7))
  context.fillStyle = vignette
  context.fillRect(0, 0, size, size)
}

/** Nuages de bruit fractal, calculés en basse résolution puis agrandis (ils sont flous par nature). */
const paintClouds: Painter = (context, size, { top, bottom }, random) => {
  const fractal = createFractalNoise(createNoise2D(random), 5)
  const low = document.createElement('canvas')
  low.width = CLOUD_RESOLUTION
  low.height = CLOUD_RESOLUTION
  const lowContext = low.getContext('2d')
  if (!lowContext) return
  const image = lowContext.createImageData(CLOUD_RESOLUTION, CLOUD_RESOLUTION)
  const from = parseHex(bottom)
  const to = parseHex(top)
  for (let y = 0; y < CLOUD_RESOLUTION; y++) {
    for (let x = 0; x < CLOUD_RESOLUTION; x++) {
      const t = Math.min(1, Math.max(0, fractal(x / 60, y / 60) * 1.4 + 0.5))
      const i = (y * CLOUD_RESOLUTION + x) * 4
      for (let channel = 0; channel < 3; channel++) image.data[i + channel] = from[channel] + (to[channel] - from[channel]) * t
      image.data[i + 3] = 255
    }
  }
  lowContext.putImageData(image, 0, 0)
  context.imageSmoothingQuality = 'high'
  context.drawImage(low, 0, 0, size, size)
}

const PAINTERS: Record<BackgroundStyleId, Painter> = {
  gradient: paintGradient,
  radial: paintRadial,
  grid: paintGrid,
  stars: paintStars,
  halftone: paintHalftone,
  rays: paintRays,
  clouds: paintClouds,
}

export function paintBackground(
  canvas: HTMLCanvasElement,
  size: number,
  style: BackgroundStyleId,
  colors: BackgroundColors,
  seed: number,
): void {
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponible')
  PAINTERS[style](context, size, colors, createRandom(seed))
}
