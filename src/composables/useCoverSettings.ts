import { readonly, ref } from 'vue'
import { applyLook, createCoverSettings, type CoverSettings } from '../domain/cover'
import type { LookId } from '../domain/looks'
import { createSeed } from '../domain/random'

export type CoverSettingsPatch = Partial<CoverSettings>

export function useCoverSettings() {
  const settings = ref<CoverSettings>(createCoverSettings())

  function update(patch: CoverSettingsPatch): void {
    settings.value = { ...settings.value, ...patch }
  }

  function selectLook(lookId: LookId): void {
    settings.value = applyLook(settings.value, lookId)
  }

  function reshuffle(): void {
    update({ seed: createSeed() })
  }

  return { settings: readonly(settings), update, selectLook, reshuffle }
}
