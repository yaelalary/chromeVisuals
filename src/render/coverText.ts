import type { CoverSettings, TextStyle } from '../domain/cover'
import { cssFont, FONTS, type FontSpec } from '../domain/fonts'
import { fitFontSize, layoutCoverText, type TextLine } from '../domain/textLayout'

export const TEXT_INPUT_KEYS = [
  'title',
  'subtitle',
  'fontId',
  'textStyle',
  'textColor',
  'textPosition',
  'textScale',
] as const satisfies ReadonlyArray<keyof CoverSettings>

export type CoverTextInput = Pick<CoverSettings, (typeof TEXT_INPUT_KEYS)[number]>

const CHROME_TEXT_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#ffffff'],
  [0.42, '#c4c9d2'],
  [0.5, '#3a3e46'],
  [0.56, '#eef0f4'],
  [0.8, '#9aa0ab'],
  [1, '#f6f7f9'],
]

const SHADOW_RATIO = 0.08

type FillFactory = (context: CanvasRenderingContext2D, line: TextLine, input: CoverTextInput) => string | CanvasGradient

const TEXT_FILLS: Record<TextStyle, FillFactory> = {
  plain: (_context, _line, input) => input.textColor,
  chrome: (context, line) => {
    const half = line.fontSize / 2
    const gradient = context.createLinearGradient(0, line.centerY - half, 0, line.centerY + half)
    for (const [offset, color] of CHROME_TEXT_STOPS) gradient.addColorStop(offset, color)
    return gradient
  },
}

const TEXT_SHADOWS: Record<TextStyle, string> = {
  plain: 'transparent',
  chrome: 'rgba(0, 0, 0, 0.45)',
}

function applyFont(context: CanvasRenderingContext2D, font: FontSpec, line: TextLine, maxWidth: number): number {
  context.font = cssFont(font, line.fontSize)
  context.letterSpacing = `${line.letterSpacing}px`
  const fittedSize = fitFontSize(line.fontSize, context.measureText(line.text).width, maxWidth)
  context.font = cssFont(font, fittedSize)
  context.letterSpacing = `${line.letterSpacing * (fittedSize / line.fontSize)}px`
  return fittedSize
}

export function paintCoverText(context: CanvasRenderingContext2D, input: CoverTextInput, size: number): void {
  const layout = layoutCoverText(input, size)
  const font = FONTS[input.fontId]
  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (const line of layout.lines) {
    const fittedSize = applyFont(context, font, line, layout.maxWidth)
    context.fillStyle = TEXT_FILLS[input.textStyle](context, line, input)
    context.shadowColor = TEXT_SHADOWS[input.textStyle]
    context.shadowBlur = fittedSize * SHADOW_RATIO
    context.fillText(line.text, layout.centerX, line.centerY)
  }
  context.restore()
}
