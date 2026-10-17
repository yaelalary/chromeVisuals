<script setup lang="ts">
import { computed } from 'vue'
import { LOOKS, type LookId } from '../../domain/looks'
import SwatchPicker from '../ui/SwatchPicker.vue'

defineProps<{ modelValue: LookId }>()

const emit = defineEmits<{ select: [lookId: LookId] }>()

const options = computed(() =>
  (Object.keys(LOOKS) as LookId[]).map((id) => {
    const look = LOOKS[id]
    return {
      value: id,
      label: look.label,
      description: look.description,
      swatchStyle: {
        '--swatch-top': look.defaults.backgroundTop,
        '--swatch-bottom': look.defaults.backgroundBottom,
        '--swatch-tint': look.defaults.tint,
        '--swatch-glow': look.environment.horizon,
      },
    }
  }),
)
</script>

<template>
  <SwatchPicker label="Ambiance" hide-label :model-value="modelValue" :options="options" @update:model-value="emit('select', $event)">
    <template #preview="{ option }">
      <span class="look-swatch" :style="option.swatchStyle">
        <span class="look-swatch__orb" />
      </span>
    </template>
  </SwatchPicker>
</template>

<style scoped>
.look-swatch {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--swatch-top), var(--swatch-bottom));
}

.look-swatch__orb {
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, var(--swatch-tint) 0%, transparent 34%),
    radial-gradient(circle at 60% 70%, var(--swatch-glow) 0%, transparent 60%),
    linear-gradient(160deg, var(--swatch-tint) 0%, var(--swatch-glow) 50%, var(--swatch-tint) 100%);
}
</style>
