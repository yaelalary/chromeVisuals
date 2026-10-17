import type { CoverSettings } from './cover'
import type { Vec3 } from './vector'

export interface MaterialSpec {
  metalness: number
  roughness: number
  clearcoat: number
  iridescence: number
  transmission: number
  ior: number
  thickness: number
  envIntensity: number
}

export interface LightPanelSpec {
  color: string
  intensity: number
  position: Vec3
  size: readonly [number, number]
}

/** Studio virtuel dont le chrome reflète l'image : dôme dégradé + panneaux lumineux. */
export interface EnvironmentSpec {
  sky: string
  horizon: string
  ground: string
  panels: LightPanelSpec[]
}

export type LookDefaults = Pick<
  CoverSettings,
  | 'shapeId'
  | 'tint'
  | 'backgroundStyle'
  | 'backgroundTop'
  | 'backgroundBottom'
  | 'bloom'
  | 'grain'
  | 'fontId'
  | 'textStyle'
  | 'textColor'
>

export interface Look {
  label: string
  description: string
  material: MaterialSpec
  environment: EnvironmentSpec
  defaults: LookDefaults
}

export type LookId = 'chrome' | 'holo' | 'ice' | 'nocturne'

const POLISHED_METAL: MaterialSpec = {
  metalness: 1,
  roughness: 0.06,
  clearcoat: 1,
  iridescence: 0,
  transmission: 0,
  ior: 1.5,
  thickness: 0,
  envIntensity: 1.2,
}

export const LOOKS: Record<LookId, Look> = {
  chrome: {
    label: 'Chrome',
    description: 'Tubes argentés sur fond blanc',
    material: POLISHED_METAL,
    environment: {
      sky: '#f4f5f7',
      horizon: '#1b1c1f',
      ground: '#060607',
      panels: [
        { color: '#ffffff', intensity: 3, position: [0, 9, 6], size: [14, 2] },
        { color: '#ffffff', intensity: 2.5, position: [-11, 2, 4], size: [2, 10] },
        { color: '#ffffff', intensity: 2, position: [6, -6, 6], size: [12, 1.2] },
        { color: '#ffffff', intensity: 2, position: [-5, -4, -8], size: [10, 1] },
        { color: '#000000', intensity: 0, position: [7, 5, 7], size: [2, 14] },
        { color: '#000000', intensity: 0, position: [-6, 7, -8], size: [12, 2] },
      ],
    },
    defaults: {
      shapeId: 'ribbons',
      backgroundStyle: 'gradient',
      tint: '#f2f3f5',
      backgroundTop: '#f8f8f8',
      backgroundBottom: '#e8e8ea',
      bloom: 0.35,
      grain: 0.06,
      fontId: 'didone',
      textStyle: 'plain',
      textColor: '#0a0a0a',
    },
  },
  holo: {
    label: 'Holo',
    description: 'Métal liquide irisé rose et violet',
    material: { ...POLISHED_METAL, roughness: 0.1, iridescence: 1, envIntensity: 1.3 },
    environment: {
      sky: '#e6dcff',
      horizon: '#ff7fbf',
      ground: '#6b4fd8',
      panels: [
        { color: '#ff5fa8', intensity: 4, position: [-9, 4, 6], size: [6, 10] },
        { color: '#7b5cff', intensity: 5, position: [9, 3, 5], size: [5, 12] },
        { color: '#ffffff', intensity: 6, position: [0, 10, 4], size: [12, 2] },
        { color: '#8fd8ff', intensity: 3, position: [3, -6, 8], size: [10, 2] },
      ],
    },
    defaults: {
      shapeId: 'liquid',
      backgroundStyle: 'gradient',
      tint: '#e8dfff',
      backgroundTop: '#f4eefc',
      backgroundBottom: '#e5dcf5',
      bloom: 0.45,
      grain: 0.05,
      fontId: 'tech',
      textStyle: 'chrome',
      textColor: '#ffffff',
    },
  },
  ice: {
    label: 'Ice',
    description: 'Verre bleu glacé entrelacé',
    material: {
      metalness: 0.15,
      roughness: 0.02,
      clearcoat: 1,
      iridescence: 0.4,
      transmission: 0.9,
      ior: 1.5,
      thickness: 1.5,
      envIntensity: 1.6,
    },
    environment: {
      sky: '#eaf4ff',
      horizon: '#2f6fd6',
      ground: '#04122e',
      panels: [
        { color: '#ffffff', intensity: 6, position: [0, 9, 5], size: [12, 2] },
        { color: '#7fb6ff', intensity: 4, position: [-10, 0, 3], size: [2, 12] },
        { color: '#cfe6ff', intensity: 4, position: [10, 2, -4], size: [3, 10] },
      ],
    },
    defaults: {
      shapeId: 'tangle',
      backgroundStyle: 'radial',
      tint: '#a9ccff',
      backgroundTop: '#0d2a63',
      backgroundBottom: '#7aaef2',
      bloom: 0.55,
      grain: 0.08,
      fontId: 'y2k',
      textStyle: 'plain',
      textColor: '#ffffff',
    },
  },
  nocturne: {
    label: 'Nocturne',
    description: 'Éclats acérés dans la nuit',
    material: { ...POLISHED_METAL, roughness: 0.16, envIntensity: 1.5 },
    environment: {
      sky: '#16233d',
      horizon: '#9fc2ff',
      ground: '#000000',
      panels: [
        { color: '#cfe0ff', intensity: 6, position: [0, 8, 6], size: [14, 0.8] },
        { color: '#5d84d6', intensity: 3, position: [-9, -2, 4], size: [1, 10] },
        { color: '#ffffff', intensity: 4, position: [8, 3, -6], size: [0.8, 9] },
      ],
    },
    defaults: {
      shapeId: 'shards',
      backgroundStyle: 'stars',
      tint: '#b8cdf0',
      backgroundTop: '#05070c',
      backgroundBottom: '#0e1424',
      bloom: 0.6,
      grain: 0.22,
      fontId: 'gothic',
      textStyle: 'plain',
      textColor: '#ffffff',
    },
  },
}
