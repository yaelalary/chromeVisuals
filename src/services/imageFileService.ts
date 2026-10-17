import { fitWithin, IMAGE_PREVIEW_SIZE, IMAGE_PROCESSING_SIZE, type ImageAsset } from '../domain/imageLayer'
import { hasTransparency } from '../domain/imageRelief'

function decodeImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.src = url
  return image
    .decode()
    .then(() => image)
    .finally(() => URL.revokeObjectURL(url))
}

function drawScaled(image: HTMLImageElement, maxSize: number): HTMLCanvasElement {
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, maxSize)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D indisponible')
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

/** Lit un fichier image du disque et le réduit à la résolution de traitement. */
export async function loadImageAsset(file: File): Promise<ImageAsset> {
  if (!file.type.startsWith('image/')) throw new Error("Ce fichier n'est pas une image")
  const image = await decodeImage(file)
  const canvas = drawScaled(image, IMAGE_PROCESSING_SIZE)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponible')
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  return {
    name: file.name,
    width: canvas.width,
    height: canvas.height,
    data,
    hasAlpha: hasTransparency(data),
    previewUrl: drawScaled(image, IMAGE_PREVIEW_SIZE).toDataURL('image/png'),
  }
}
