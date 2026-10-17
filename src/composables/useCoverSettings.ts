import { ref, type Ref } from 'vue'
import { applyLook, createCoverSettings, type CoverSettings } from '../domain/cover'
import type { ImageLayer } from '../domain/imageLayer'
import type { LookId } from '../domain/looks'
import { createSeed } from '../domain/random'

export type CoverSettingsPatch = Partial<CoverSettings>
export type ImageLayerPatch = Partial<Omit<ImageLayer, 'asset'>>

export function useCoverSettings() {
  const settings = ref<CoverSettings>(createCoverSettings()) as Ref<CoverSettings>

  function update(patch: CoverSettingsPatch): void {
    settings.value = { ...settings.value, ...patch }
  }

  function selectLook(lookId: LookId): void {
    settings.value = applyLook(settings.value, lookId)
  }

  function reshuffle(): void {
    update({ seed: createSeed() })
  }

  function setImageLayer(layer: ImageLayer | null): void {
    update({ image: layer })
  }

  function updateImage(patch: ImageLayerPatch): void {
    const current = settings.value.image
    if (current) update({ image: { ...current, ...patch } })
  }

  const readonlySettings: Readonly<Ref<CoverSettings>> = settings

  return { settings: readonlySettings, update, selectLook, reshuffle, setImageLayer, updateImage }
}
