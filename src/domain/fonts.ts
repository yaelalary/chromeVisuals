export type FontId = 'didone' | 'gothic' | 'tech' | 'y2k' | 'grotesk'

export interface FontSpec {
  label: string
  family: string
  weight: number
  fallback: string
}

export const FONTS: Record<FontId, FontSpec> = {
  didone: { label: 'Didone', family: 'Bodoni Moda', weight: 500, fallback: 'serif' },
  gothic: { label: 'Gothique', family: 'UnifrakturCook', weight: 700, fallback: 'serif' },
  tech: { label: 'Tech', family: 'Michroma', weight: 400, fallback: 'sans-serif' },
  y2k: { label: 'Y2K', family: 'Zen Dots', weight: 400, fallback: 'sans-serif' },
  grotesk: { label: 'Grotesk', family: 'Inter', weight: 600, fallback: 'sans-serif' },
}

export function cssFont(font: FontSpec, sizePx: number): string {
  return `${font.weight} ${sizePx}px "${font.family}", ${font.fallback}`
}
