<script setup lang="ts">
import { computed, ref } from 'vue'
import ControlPanel from './components/controls/ControlPanel.vue'
import CoverStage from './components/stage/CoverStage.vue'
import DrawingToolbar from './components/stage/DrawingToolbar.vue'
import { useCoverExport } from './composables/useCoverExport'
import { useCoverSettings } from './composables/useCoverSettings'
import { useDrawingTools } from './composables/useDrawingTools'

const { settings, update, selectLook, reshuffle } = useCoverSettings()
const { mode, brush, isDrawingShape, isDrawing, canUndo, addStroke, undo, clear, setBrush } = useDrawingTools(
  settings,
  update,
)

const stage = ref<InstanceType<typeof CoverStage>>()
const { exporting, exportError, exportCover } = useCoverExport(() => stage.value, settings)
const renderUnavailable = computed(() => stage.value?.failed ?? true)
</script>

<template>
  <div class="app">
    <header class="app__header">
      <h1 class="app__logo chrome-text">Chrome Visuals</h1>
      <p class="app__tagline">Générateur de covers Y2K</p>
    </header>
    <main class="app__main">
      <CoverStage
        ref="stage"
        class="app__stage"
        :settings="settings"
        :drawing="isDrawing"
        :brush="brush"
        @stroke="addStroke"
      >
        <template #tools>
          <DrawingToolbar
            v-if="isDrawingShape"
            v-model:mode="mode"
            :brush="brush"
            :can-undo="canUndo"
            @update-brush="setBrush"
            @undo="undo"
            @clear="clear"
          />
        </template>
      </CoverStage>
      <aside class="app__panel">
        <ControlPanel
          :settings="settings"
          :exporting="exporting"
          :export-error="exportError"
          :export-disabled="renderUnavailable"
          @update="update"
          @select-look="selectLook"
          @reshuffle="reshuffle"
          @export="exportCover"
        />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.app__logo {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.app__tagline {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.app__main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr var(--panel-width);
}

.app__stage {
  padding: var(--space-6);
}

.app__panel {
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
}

@media (max-width: 900px) {
  .app {
    height: auto;
  }

  .app__main {
    grid-template-columns: 1fr;
  }

  .app__stage {
    padding: var(--space-4);
  }

  .app__panel {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .app__tagline {
    display: none;
  }
}
</style>
