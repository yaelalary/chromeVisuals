import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { CoverSettings } from '../domain/cover'
import { DEFAULT_BRUSH, type Brush, type DrawingMode, type Point2 } from '../domain/drawing'
import type { CoverSettingsPatch } from './useCoverSettings'

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable)
}

function isUndoShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z'
}

export function useDrawingTools(settings: Readonly<Ref<CoverSettings>>, update: (patch: CoverSettingsPatch) => void) {
  const mode = ref<DrawingMode>('draw')
  const brush = ref<Brush>({ ...DEFAULT_BRUSH })

  const isDrawingShape = computed(() => settings.value.shapeId === 'drawn')
  const isDrawing = computed(() => isDrawingShape.value && mode.value === 'draw')
  const canUndo = computed(() => settings.value.drawnStrokes.length > 0)

  watch(isDrawingShape, (active) => {
    if (active) mode.value = 'draw'
  })

  function addStroke(points: Point2[]): void {
    update({ drawnStrokes: [...settings.value.drawnStrokes, { ...brush.value, points }] })
  }

  function undo(): void {
    if (canUndo.value) update({ drawnStrokes: settings.value.drawnStrokes.slice(0, -1) })
  }

  function clear(): void {
    update({ drawnStrokes: [] })
  }

  function setBrush(patch: Partial<Brush>): void {
    brush.value = { ...brush.value, ...patch }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!isDrawingShape.value || !isUndoShortcut(event) || isEditableTarget(event.target)) return
    event.preventDefault()
    undo()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return { mode, brush, isDrawingShape, isDrawing, canUndo, addStroke, undo, clear, setBrush }
}
