<script setup lang="ts" generic="T extends string, O extends Swatch<T>">
import { computed } from 'vue'
import type { Swatch } from './options'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: T
    options: O[]
    hideLabel?: boolean
  }>(),
  { hideLabel: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

defineSlots<{ preview?(props: { option: O }): unknown }>()

const items = computed(() => props.options.map((option) => ({ option, active: option.value === props.modelValue })))
</script>

<template>
  <div class="field">
    <span v-if="!hideLabel" class="field__label">{{ label }}</span>
    <div class="swatch-picker" role="radiogroup" :aria-label="label">
      <button
        v-for="item in items"
        :key="item.option.value"
        type="button"
        role="radio"
        class="swatch"
        :class="{ 'swatch--active': item.active }"
        :aria-checked="item.active"
        :title="item.option.description"
        @click="emit('update:modelValue', item.option.value)"
      >
        <span class="swatch__preview">
          <slot name="preview" :option="item.option">
            <img class="swatch__image" :src="item.option.imageUrl" alt="" />
          </slot>
        </span>
        <span class="swatch__label">{{ item.option.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.swatch-picker {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.swatch {
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

.swatch:hover {
  border-color: var(--color-border-strong);
}

.swatch--active,
.swatch--active:hover {
  border-color: var(--color-accent);
}

.swatch__preview {
  position: relative;
  display: block;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.swatch__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.swatch__label {
  padding-bottom: var(--space-1);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-text);
}
</style>
