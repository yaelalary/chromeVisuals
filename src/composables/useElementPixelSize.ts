import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const MAX_PIXEL_RATIO = 2

/** Largeur d'un élément en pixels physiques, suivie au redimensionnement. */
export function useElementPixelSize(element: Ref<HTMLElement | undefined>) {
  const pixelSize = ref(0)
  let observer: ResizeObserver | undefined

  onMounted(() => {
    if (!element.value) return
    observer = new ResizeObserver(([entry]) => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      pixelSize.value = Math.round(entry.contentRect.width * ratio)
    })
    observer.observe(element.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return pixelSize
}
