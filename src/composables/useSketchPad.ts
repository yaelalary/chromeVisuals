import { computed, shallowRef, triggerRef, type Ref } from 'vue'
import { isDrawablePath, MIN_POINT_SPACING, simplifyPath, type Point2 } from '../domain/drawing'
import { clamp } from '../domain/vector'

const OVERFLOW = 0.2

interface SketchPadOptions {
  enabled: Ref<boolean>
  onStroke: (points: Point2[]) => void
}

function toPathData(points: readonly Point2[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  const segments = (rest.length > 0 ? rest : [first]).map(([u, v]) => `L${u} ${v}`)
  return `M${first[0]} ${first[1]} ${segments.join(' ')}`
}

/** Capture un tracé à main levée sur une surface et expose son aperçu sous forme de chemin SVG normalisé. */
export function useSketchPad(surface: Ref<Element | undefined>, { enabled, onStroke }: SketchPadOptions) {
  const points = shallowRef<Point2[]>([])
  let drawing = false

  const previewPath = computed(() => toPathData(points.value))

  function toFramePoint(event: PointerEvent, element: Element): Point2 {
    const rect = element.getBoundingClientRect()
    return [
      clamp((event.clientX - rect.left) / rect.width, -OVERFLOW, 1 + OVERFLOW),
      clamp((event.clientY - rect.top) / rect.height, -OVERFLOW, 1 + OVERFLOW),
    ]
  }

  function onPointerDown(event: PointerEvent): void {
    const element = surface.value
    if (!enabled.value || !element || event.button !== 0) return
    element.setPointerCapture(event.pointerId)
    drawing = true
    points.value = [toFramePoint(event, element)]
  }

  function onPointerMove(event: PointerEvent): void {
    const element = surface.value
    if (!drawing || !element) return
    const point = toFramePoint(event, element)
    const last = points.value[points.value.length - 1]
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < MIN_POINT_SPACING / 2) return
    points.value.push(point)
    triggerRef(points)
  }

  function onPointerUp(): void {
    if (!drawing) return
    drawing = false
    const simplified = simplifyPath(points.value)
    points.value = []
    if (isDrawablePath(simplified)) onStroke(simplified)
  }

  return { previewPath, onPointerDown, onPointerMove, onPointerUp }
}
