import type { Ref } from 'vue'
import type { PlacedSticker } from '../domain/stickers'

interface StickerDragOptions {
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

interface DragState {
  id: string
  offsetX: number
  offsetY: number
}

/** Glisser-déposer des stickers : positions converties en coordonnées relatives au cadre. */
export function useStickerDrag(surface: Ref<HTMLElement | undefined>, { onSelect, onMove }: StickerDragOptions) {
  let drag: DragState | null = null

  function framePoint(event: PointerEvent): [number, number] | null {
    const rect = surface.value?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]
  }

  function onPointerDown(event: PointerEvent, sticker: PlacedSticker): void {
    const point = framePoint(event)
    if (!point || event.button !== 0) return
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    drag = { id: sticker.id, offsetX: point[0] - sticker.x, offsetY: point[1] - sticker.y }
    onSelect(sticker.id)
  }

  function onPointerMove(event: PointerEvent): void {
    const point = framePoint(event)
    if (!drag || !point) return
    onMove(drag.id, point[0] - drag.offsetX, point[1] - drag.offsetY)
  }

  function onPointerUp(): void {
    drag = null
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
