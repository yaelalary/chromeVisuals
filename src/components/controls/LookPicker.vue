<script setup lang="ts">
import { computed } from 'vue'
import { LOOKS, type LookId } from '../../domain/looks'

const props = defineProps<{ modelValue: LookId }>()

const emit = defineEmits<{ select: [lookId: LookId] }>()

const cards = computed(() =>
  (Object.keys(LOOKS) as LookId[]).map((id) => {
    const look = LOOKS[id]
    return {
      id,
      label: look.label,
      description: look.description,
      active: id === props.modelValue,
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
  <div class="look-picker" role="radiogroup" aria-label="Ambiance">
    <button
      v-for="card in cards"
      :key="card.id"
      type="button"
      role="radio"
      class="look-card"
      :class="{ 'look-card--active': card.active }"
      :aria-checked="card.active"
      :title="card.description"
      @click="emit('select', card.id)"
    >
      <span class="look-card__swatch" :style="card.swatchStyle">
        <span class="look-card__orb" />
      </span>
      <span class="look-card__label">{{ card.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.look-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.look-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  cursor: pointer;
  transition: border-color var(--transition);
}

.look-card:hover {
  border-color: var(--color-border-strong);
}

.look-card--active,
.look-card--active:hover {
  border-color: var(--color-accent);
}

.look-card__swatch {
  position: relative;
  display: block;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, var(--swatch-top), var(--swatch-bottom));
  overflow: hidden;
}

.look-card__orb {
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, var(--swatch-tint) 0%, transparent 34%),
    radial-gradient(circle at 60% 70%, var(--swatch-glow) 0%, transparent 60%),
    linear-gradient(160deg, var(--swatch-tint) 0%, var(--swatch-glow) 50%, var(--swatch-tint) 100%);
}

.look-card__label {
  padding-bottom: var(--space-1);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-text);
}
</style>
