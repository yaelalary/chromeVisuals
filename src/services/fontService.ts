import { cssFont, FONTS, type FontId } from '../domain/fonts'

const SAMPLE_SIZE_PX = 64

export async function ensureFontLoaded(fontId: FontId, sampleText: string): Promise<void> {
  try {
    await document.fonts.load(cssFont(FONTS[fontId], SAMPLE_SIZE_PX), sampleText || 'A')
  } catch {
    return
  }
}
