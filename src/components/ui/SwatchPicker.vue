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
    <div class="swatch-grid" role="radiogroup" :aria-label="label">
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
