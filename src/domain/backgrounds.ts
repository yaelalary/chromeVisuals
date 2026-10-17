export type BackgroundStyleId = 'gradient' | 'radial' | 'grid' | 'stars' | 'halftone' | 'rays' | 'clouds'

export const BACKGROUND_STYLES: Record<BackgroundStyleId, { label: string }> = {
  gradient: { label: 'Dégradé' },
  radial: { label: 'Halo' },
  grid: { label: 'Grille' },
  stars: { label: 'Étoiles' },
  halftone: { label: 'Trame' },
  rays: { label: 'Rayons' },
  clouds: { label: 'Nuages' },
}
