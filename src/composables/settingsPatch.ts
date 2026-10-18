import type { CoverSettings } from '../domain/cover'
import type { CoverSettingsPatch } from './useCoverSettings'

export type PatchEmitter = (event: 'update', patch: CoverSettingsPatch) => void

/** Fabrique un setter typé champ par champ qui transmet un patch partiel d'un seul champ. */
export function createPatchSetter<P extends object>(emitPatch: (patch: Partial<P>) => void) {
  return <K extends keyof P>(key: K, value: P[K]): void => {
    const patch: Partial<P> = {}
    patch[key] = value
    emitPatch(patch)
  }
}

export function useSettingsSetter(emit: PatchEmitter) {
  return createPatchSetter<CoverSettings>((patch) => emit('update', patch))
}
