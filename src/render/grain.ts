export const GRAIN_BLEND_MODE = 'overlay'

const GRAIN_REFERENCE_SIZE = 1000

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponible')
  return context
}

/** Remplit le canvas d'un bruit gris, à fusionner en mode overlay. Le grain grossit avec la taille pour rester visible à l'export. */
export function paintGrain(canvas: HTMLCanvasElement, size: number, amount: number): void {
  canvas.width = size
  canvas.height = size
  const context = context2d(canvas)
  context.clearRect(0, 0, size, size)
  if (amount <= 0) return

  const cellSize = Math.max(1, Math.round(size / GRAIN_REFERENCE_SIZE))
  const cells = Math.ceil(size / cellSize)
  const source = document.createElement('canvas')
  source.width = cells
  source.height = cells
  const sourceContext = context2d(source)
  const image = sourceContext.createImageData(cells, cells)
  const alpha = Math.round(amount * 255)
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.random() * 255
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = alpha
  }
  sourceContext.putImageData(image, 0, 0)

  context.imageSmoothingEnabled = false
  context.drawImage(source, 0, 0, cells * cellSize, cells * cellSize)
}
