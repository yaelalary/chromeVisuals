import type { CoverSettings, TextPosition } from './cover'

export type TextRole = 'title' | 'subtitle'

export interface TextLine {
  role: TextRole
  text: string
  fontSize: number
  centerY: number
  letterSpacing: number
}

export interface CoverTextLayout {
  centerX: number
  maxWidth: number
  lines: TextLine[]
}

const TEXT_ANCHORS: Record<TextPosition, number> = { top: 0, center: 0.5, bottom: 1 }
const MARGIN_RATIO = 0.08
const TITLE_RATIO = 0.13
const SUBTITLE_RATIO = 0.26
const GAP_RATIO = 0.3
const SUBTITLE_SPACING_RATIO = 0.35

type TextInput = Pick<CoverSettings, 'title' | 'subtitle' | 'textPosition' | 'textScale'>

export function layoutCoverText(input: TextInput, size: number): CoverTextLayout {
  const margin = size * MARGIN_RATIO
  const titleSize = size * TITLE_RATIO * input.textScale
  const subtitleSize = titleSize * SUBTITLE_RATIO
  const gap = titleSize * GAP_RATIO
  const title = input.title.trim()
  const subtitle = input.subtitle.trim().toUpperCase()

  const blocks = [
    title && { role: 'title' as const, text: title, fontSize: titleSize, letterSpacing: 0 },
    subtitle && {
      role: 'subtitle' as const,
      text: subtitle,
      fontSize: subtitleSize,
      letterSpacing: subtitleSize * SUBTITLE_SPACING_RATIO,
    },
  ].filter((block) => !!block)

  const blockHeight = blocks.reduce((height, block) => height + block.fontSize, 0) + gap * Math.max(0, blocks.length - 1)
  const top = margin + TEXT_ANCHORS[input.textPosition] * (size - 2 * margin - blockHeight)

  let cursor = top
  const lines = blocks.map((block): TextLine => {
    const line = { ...block, centerY: cursor + block.fontSize / 2 }
    cursor += block.fontSize + gap
    return line
  })

  return { centerX: size / 2, maxWidth: size - 2 * margin, lines }
}

export function fitFontSize(fontSize: number, measuredWidth: number, maxWidth: number): number {
  if (measuredWidth <= maxWidth || measuredWidth === 0) return fontSize
  return fontSize * (maxWidth / measuredWidth)
}
