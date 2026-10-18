const CHROME_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#ffffff'],
  [0.42, '#c4c9d2'],
  [0.5, '#3a3e46'],
  [0.56, '#eef0f4'],
  [0.8, '#9aa0ab'],
  [1, '#f6f7f9'],
]

/** Dégradé vertical façon métal poli, du haut (top) au bas (bottom) de la zone à remplir. */
export function chromeGradient(context: CanvasRenderingContext2D, top: number, bottom: number): CanvasGradient {
  const gradient = context.createLinearGradient(0, top, 0, bottom)
  for (const [offset, color] of CHROME_STOPS) gradient.addColorStop(offset, color)
  return gradient
}
