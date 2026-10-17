import type { CoverSettings } from '../domain/cover'
import type { CoverSettingsPatch } from './useCoverSettings'

export type PatchEmitter = (event: 'update', patch: CoverSettingsPatch) => void

/** Fabrique un setter typé champ par champ qui émet un patch partiel des réglages. */
export function useSettingsSetter(emit: PatchEmitter) {
  return <K extends keyof CoverSettings>(key: K, value: CoverSettings[K]): void => {
    emit('update', { [key]: value } as CoverSettingsPatch)
  }
}
