import { ref, type Ref } from 'vue'
import { coverFileName, type CoverSettings, type ExportSize } from '../domain/cover'
import { downloadCanvas } from '../services/downloadService'

export interface CoverCapturer {
  capture: (size: number) => Promise<HTMLCanvasElement>
}

export function useCoverExport(capturer: () => CoverCapturer | undefined, settings: Readonly<Ref<CoverSettings>>) {
  const exporting = ref(false)
  const exportError = ref<string>()

  async function exportCover(size: ExportSize): Promise<void> {
    const source = capturer()
    if (!source || exporting.value) return
    exporting.value = true
    exportError.value = undefined
    try {
      const canvas = await source.capture(size)
      await downloadCanvas(canvas, coverFileName(settings.value, size))
    } catch {
      exportError.value = "L'export a échoué. Essaie la taille inférieure."
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportError, exportCover }
}
