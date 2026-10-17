function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encodage PNG impossible'))), 'image/png')
  })
}

export async function downloadCanvas(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  const url = URL.createObjectURL(await canvasToBlob(canvas))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
