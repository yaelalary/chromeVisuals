<script setup lang="ts">
import { computed, ref, toRef, type CSSProperties } from 'vue'
import type { CoverSettings } from '../../domain/cover'
import { brushScreenDiameter, type Brush, type Point2 } from '../../domain/drawing'
import { useChromeRenderer } from '../../composables/useChromeRenderer'
import { useCoverOverlays } from '../../composables/useCoverOverlays'
import { useElementPixelSize } from '../../composables/useElementPixelSize'
import { useSketchPad } from '../../composables/useSketchPad'
import { composeCover } from '../../render/composeCover'
import { GRAIN_BLEND_MODE } from '../../render/grain'
import AppButton from '../ui/AppButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'

const props = defineProps<{
  settings: CoverSettings
  drawing: boolean
  brush: Brush
}>()

const emit = defineEmits<{ stroke: [points: Point2[]] }>()

const frame = ref<HTMLElement>()
const sceneCanvas = ref<HTMLCanvasElement>()
const grainCanvas = ref<HTMLCanvasElement>()
const textCanvas = ref<HTMLCanvasElement>()
const sketchSurface = ref<SVGSVGElement>()

const settings = toRef(props, 'settings')
const drawing = toRef(props, 'drawing')
const orbitEnabled = computed(() => !props.drawing)
const pixelSize = useElementPixelSize(frame)
const { failed, captureScene, resetView } = useChromeRenderer(sceneCanvas, settings, pixelSize, orbitEnabled)
useCoverOverlays(grainCanvas, textCanvas, settings, pixelSize)

const sketchWidth = computed(() => brushScreenDiameter(props.brush.size, props.settings.thickness, 1))
const { previewPath, onPointerDown, onPointerMove, onPointerUp } = useSketchPad(sketchSurface, {
  enabled: drawing,
  onStroke: (points) => emit('stroke', points),
})

const grainStyle: CSSProperties = { mixBlendMode: GRAIN_BLEND_MODE }
const resetDisabled = computed(() => failed.value || props.drawing)
const showDrawHint =computed(() => props.drawing && props.settings.drawnStrokes.length === 0)
const usageHint = computed(() =>
  props.drawing
    ? 'Dessine directement sur l’image : chaque trait devient un tube chrome.'
    : 'Glisse pour faire pivoter, molette pour zoomer.',
)

function capture(size: number): Promise<HTMLCanvasElement> {
  return composeCover(captureScene(size), props.settings, size)
}

defineExpose({ capture, failed })
</script>

<template>
  <div class="stage">
    <div class="stage__viewport">
      <div ref="frame" class="stage__frame">
        <canvas ref="sceneCanvas" class="stage__layer" />
        <canvas ref="grainCanvas" class="stage__layer stage__layer--passive" :style="grainStyle" />
        <canvas ref="textCanvas" class="stage__layer stage__layer--passive" />
        <svg
          v-show="drawing"
          ref="sketchSurface"
          class="stage__layer stage__layer--sketch"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <path class="stage__sketch-path" :d="previewPath" :stroke-width="sketchWidth" />
        </svg>
        <p v-if="showDrawHint" class="stage__hint">Dessine tes formes ici</p>
        <div v-if="failed" class="stage__fallback">
          <InlineMessage tone="danger">
            Ton navigateur n'a pas pu initialiser WebGL : le rendu 3D est indisponible.
          </InlineMessage>
        </div>
      </div>
    </div>
    <slot name="tools" />
    <div class="stage__toolbar">
      <InlineMessage>{{ usageHint }}</InlineMessage>
      <AppButton :disabled="resetDisabled" @click="resetView">Recentrer</AppButton>
    </div>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  min-height: 0;
}

.stage__viewport {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  container-type: size;
}

.stage__frame {
  position: relative;
  width: min(100cqw, 100cqh);
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  background: var(--color-stage-empty);
  box-shadow: var(--shadow-stage);
  overflow: hidden;
}

.stage__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.stage__layer:active {
  cursor: grabbing;
}

.stage__layer--passive {
  pointer-events: none;
}

.stage__layer--sketch,
.stage__layer--sketch:active {
  cursor: crosshair;
  touch-action: none;
}

.stage__sketch-path {
  fill: none;
  stroke: var(--color-sketch);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.stage__hint {
  position: absolute;
  left: 50%;
  bottom: var(--space-5);
  margin: 0;
  padding: var(--space-2) var(--space-4);
  transform: translateX(-50%);
  border-radius: var(--radius-pill);
  background: var(--color-hint-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  pointer-events: none;
}

.stage__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  text-align: center;
}

.stage__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .stage__viewport {
    flex: none;
    aspect-ratio: 1;
  }
}
</style>
