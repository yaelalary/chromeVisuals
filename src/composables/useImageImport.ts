import { markRaw, ref, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import { createImageLayer, type ImageLayer } from '../domain/imageLayer'
import { loadImageAsset } from '../services/imageFileService'

/** Importe une image du disque ; un remplacement garde les réglages du calque existant. */
export function useImageImport(settings: Readonly<Ref<CoverSettings>>, setImageLayer: (layer: ImageLayer | null) => void) {
  const importing = ref(false)
  const importError = ref<string>()

  async function importImage(file: File): Promise<void> {
    importing.value = true
    importError.value = undefined
    try {
      const asset = markRaw(await loadImageAsset(file))
      const current = settings.value.image
      setImageLayer(current ? { ...current, asset } : createImageLayer(asset))
    } catch {
      importError.value = "Impossible de lire cette image. Essaie un PNG, un JPG ou un SVG."
    } finally {
      importing.value = false
    }
  }

  function removeImage(): void {
    importError.value = undefined
    setImageLayer(null)
  }

  return { importing, importError, importImage, removeImage }
}
