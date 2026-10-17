<script setup lang="ts">
import { ref } from 'vue'
import { EXPORT_SIZES, type ExportSize } from '../../domain/cover'
import AppButton from '../ui/AppButton.vue'
import InlineMessage from '../ui/InlineMessage.vue'
import PanelSection from '../ui/PanelSection.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import type { Option } from '../ui/options'

defineProps<{
  exporting: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ export: [size: ExportSize] }>()

const size = ref<ExportSize>(EXPORT_SIZES[EXPORT_SIZES.length - 1])
const sizeOptions: Option<ExportSize>[] = EXPORT_SIZES.map((value) => ({ value, label: `${value} px` }))
</script>

<template>
  <PanelSection title="Export">
    <SegmentedControl label="Taille (carré)" v-model="size" :options="sizeOptions" />
    <AppButton variant="primary" :busy="exporting" :disabled="disabled" @click="emit('export', size)">
      Télécharger le PNG
    </AppButton>
    <InlineMessage v-if="error" tone="danger">{{ error }}</InlineMessage>
    <InlineMessage v-else>3000 px est le format recommandé par Spotify, Apple Music et DistroKid.</InlineMessage>
  </PanelSection>
</template>
