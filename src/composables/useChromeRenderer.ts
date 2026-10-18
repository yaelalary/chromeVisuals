import { onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue'
import { effectiveSymmetry, type CoverSettings } from '../domain/cover'
import { imagePlacement } from '../domain/imageLayer'
import { buildImageRelief, isMirrored } from '../domain/imageRelief'
import { LOOKS } from '../domain/looks'
import { describeForm } from '../domain/sceneForm'
import { ChromeRenderer } from '../render/ChromeRenderer'

export function useChromeRenderer(
  canvas: Ref<HTMLCanvasElement | undefined>,
  settings: Readonly<Ref<CoverSettings>>,
  pixelSize: Ref<number>,
  orbitEnabled: Ref<boolean>,
) {
  const renderer = shallowRef<ChromeRenderer>()
  const failed = ref(false)
  const field = <K extends keyof CoverSettings>(key: K) => () => settings.value[key]

  onMounted(() => {
    if (!canvas.value) return
    try {
      renderer.value = new ChromeRenderer(canvas.value)
    } catch {
      failed.value = true
    }
  })

  onBeforeUnmount(() => renderer.value?.dispose())

  watch([renderer, pixelSize], ([instance, size]) => instance?.setSize(size), { immediate: true })

  watch(
    [renderer, field('lookId')],
    ([instance, lookId]) => instance?.setEnvironment(LOOKS[lookId].environment),
    { immediate: true },
  )

  watch(
    [renderer, field('lookId'), field('tint')],
    ([instance, lookId, tint]) => instance?.setMaterial(LOOKS[lookId].material, tint),
    { immediate: true },
  )

  watch(
    [renderer, field('surfaceTexture'), field('textureStrength'), field('textureScale')],
    ([instance, textureId, strength, scale]) => instance?.setSurfaceFinish({ textureId, strength, scale }),
    { immediate: true },
  )

  watch(
    [renderer, field('backgroundStyle'), field('backgroundTop'), field('backgroundBottom'), field('seed')],
    ([instance, style, top, bottom, seed]) => instance?.setBackground({ style, colors: { top, bottom }, seed }),
    { immediate: true },
  )

  watch([renderer, field('bloom')], ([instance, strength]) => instance?.setBloom(strength), { immediate: true })

  watch(
    [renderer, field('aberration'), field('vignette')],
    ([instance, aberration, vignette]) => instance?.setLens(aberration, vignette),
    { immediate: true },
  )

  watch(
    [
      renderer,
      field('shapeId'),
      field('seed'),
      field('density'),
      field('thickness'),
      field('chaos'),
      field('drawnStrokes'),
      field('symmetry'),
    ],
    ([instance]) => instance?.setForm(describeForm(settings.value), effectiveSymmetry(settings.value)),
    { immediate: true },
  )

  const image = () => settings.value.image

  watch(
    [renderer, () => image()?.asset, () => image()?.treatment, () => image()?.keep, () => image()?.threshold, () => image()?.colors],
    ([instance]) => {
      const layer = image()
      if (!layer) return instance?.setImage(null, { mirrored: false, withColors: false })
      instance?.setImage(buildImageRelief(layer.asset, layer), {
        mirrored: isMirrored(layer.treatment),
        withColors: layer.colors === 'image',
      })
    },
    { immediate: true },
  )

  watch(
    [renderer, () => image()?.scale, () => image()?.offsetX, () => image()?.offsetY, () => image()?.depth, () => image()?.treatment],
    ([instance]) => {
      const layer = image()
      if (layer) instance?.setImagePlacement(imagePlacement(layer))
    },
    { immediate: true },
  )

  watch(
    [renderer, orbitEnabled],
    ([instance, enabled]) => {
      instance?.setOrbitEnabled(enabled)
      if (!enabled) instance?.resetView()
    },
    { immediate: true },
  )

  function captureScene(size: number): HTMLCanvasElement {
    if (!renderer.value) throw new Error('Rendu 3D indisponible')
    return renderer.value.capture(size)
  }

  function resetView(): void {
    renderer.value?.resetView()
  }

  return { failed, captureScene, resetView }
}
